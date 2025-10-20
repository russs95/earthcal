<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| sync_ical.php — EarthCal v1.0
|--------------------------------------------------------------------------
| Pull the latest ICS for a webcal subscription and import into items_v1_tb.
|
| Input (JSON):
| {
|   "subscription_id": 12345,
|   "force_full": false   // optional; ignore ETag/Last-Modified if true
| }
|
| Behavior:
|  1) Look up subscription (must be source_type='webcal' & is_active=1)
|  2) Conditional GET using saved ETag / Last-Modified (unless force_full)
|  3) Parse ICS → components (VEVENT/VTODO/VJOURNAL)
|  4) Upsert by (calendar_id, uid):
|     - If exists: update mutable fields
|     - If new: insert
|     - If import_mode='replace': soft-delete items not present anymore
|  5) Update subscription diagnostics and return counts
|--------------------------------------------------------------------------
*/

require_once '../pdo_connect.php';
header('Content-Type: application/json; charset=utf-8');

/* ----------------------------- CORS ----------------------------- */
$allowed_origins = [
  'https://ecobricks.org','https://earthcal.app','https://beta.earthcal.app','http://localhost','file://'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== null) {
  $trim = rtrim($origin,'/');
  if (!in_array($trim,$allowed_origins,true)) {
    http_response_code(403);
    echo json_encode(['ok'=>false,'error'=>'cors_denied']); exit;
  }
  header('Access-Control-Allow-Origin: '.$trim);
} else {
  header('Access-Control-Allow-Origin: *');
}
if ($_SERVER['REQUEST_METHOD']==='OPTIONS'){
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  exit(0);
}
if ($_SERVER['REQUEST_METHOD']!=='POST'){
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'invalid_method']); exit;
}

/* --------------------------- INPUT ----------------------------- */
$raw = file_get_contents('php://input');
$in  = json_decode($raw?:'[]', true);
if (!is_array($in)) $in = $_POST;

$subscriptionId = filter_var($in['subscription_id'] ?? null, FILTER_VALIDATE_INT);
$forceFull = !empty($in['force_full']);
if (!$subscriptionId){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'subscription_id_required']); exit;
}

/* -------------------- Helpers: dates & ICS --------------------- */
function parse_ics_datetime(string $val, ?string $propParamsTzid): array {
  // Returns ['utc'=>?string, 'all_day'=>bool]
  // Handles:
  //  - YYYYMMDD (VALUE=DATE all-day)
  //  - YYYYMMDDTHHMMSSZ (UTC)
  //  - YYYYMMDDTHHMMSS (floating w/ TZID param)
  $val = trim($val);
  // VALUE=DATE → all-day
  if (preg_match('/^\d{8}$/', $val)) {
    $date = substr($val,0,4).'-'.substr($val,4,2).'-'.substr($val,6,2);
    $dt = new DateTime($date.' 00:00:00', new DateTimeZone($propParamsTzid ?: 'Etc/UTC'));
    $dt->setTimezone(new DateTimeZone('UTC'));
    return ['utc'=>$dt->format('Y-m-d H:i:s'), 'all_day'=>true];
  }
  // Zulu UTC
  if (preg_match('/^\d{8}T\d{6}Z$/', $val)) {
    $dt = DateTime::createFromFormat('Ymd\THis\Z', $val, new DateTimeZone('UTC'));
    return ['utc'=>$dt? $dt->format('Y-m-d H:i:s'): null, 'all_day'=>false];
  }
  // Local with TZID (or floating)
  if (preg_match('/^\d{8}T\d{6}$/',$val)) {
    $tz = $propParamsTzid ?: 'Etc/UTC';
    try { $zone = new DateTimeZone($tz); } catch(Throwable $e){ $zone = new DateTimeZone('Etc/UTC'); }
    $dt = DateTime::createFromFormat('Ymd\THis', $val, $zone);
    if (!$dt) return ['utc'=>null,'all_day'=>false];
    $dt->setTimezone(new DateTimeZone('UTC'));
    return ['utc'=>$dt->format('Y-m-d H:i:s'), 'all_day'=>false];
  }
  return ['utc'=>null,'all_day'=>false];
}

function normalize_ics_payload(string $ics): string {
  // Strip common BOM sequences and normalise encoding to UTF-8 when possible
  if (strncmp($ics, "\xEF\xBB\xBF", 3) === 0) {
    $ics = substr($ics, 3);
  } elseif (strncmp($ics, "\xFE\xFF", 2) === 0) {
    $converted = function_exists('mb_convert_encoding')
      ? @mb_convert_encoding($ics, 'UTF-8', 'UTF-16BE')
      : @iconv('UTF-16BE', 'UTF-8//IGNORE', $ics);
    if (is_string($converted)) {
      $ics = $converted;
    }
  } elseif (strncmp($ics, "\xFF\xFE", 2) === 0) {
    $converted = function_exists('mb_convert_encoding')
      ? @mb_convert_encoding($ics, 'UTF-8', 'UTF-16LE')
      : @iconv('UTF-16LE', 'UTF-8//IGNORE', $ics);
    if (is_string($converted)) {
      $ics = $converted;
    }
  }
  return $ics;
}

function unfold_ical(string $ics): array {
  // RFC5545 line unfolding (CRLF + space/tab)
  $ics = normalize_ics_payload($ics);
  $ics = str_replace("\r\n", "\n", $ics);
  $lines = explode("\n", $ics);
  $out = [];
  foreach ($lines as $ln) {
    if ($ln === '') { $out[] = $ln; continue; }
    if (isset($out[count($out)-1]) && (isset($ln[0]) && ($ln[0]===' ' || $ln[0]==="\t"))) {
      $out[count($out)-1] .= substr($ln,1);
    } else {
      $out[] = $ln;
    }
  }
  return $out;
}

function split_components(string $ics): array {
  // returns array of ['name'=>'VEVENT','raw'=>'...','lines'=>[]]
  $lines = unfold_ical($ics);
  $components = [];
  $stack = [];
  $buffer = [];
  foreach ($lines as $ln) {
    if (preg_match('/^BEGIN:([A-Z0-9-]+)/i',$ln,$m)) {
      if (!empty($stack)) $buffer[] = $ln;
      $stack[] = strtoupper($m[1]);
      if (count($stack)===1) $buffer = [$ln];
      continue;
    }
    if (preg_match('/^END:([A-Z0-9-]+)/i',$ln,$m)) {
      $name = strtoupper($m[1]);
      $buffer[] = $ln;
      array_pop($stack);
      if (count($stack)===0) {
        $components[] = ['name'=>$name,'raw'=>implode("\n",$buffer),'lines'=>$buffer];
        $buffer = [];
      }
      continue;
    }
    if (!empty($stack)) $buffer[] = $ln;
  }
  return $components;
}

function parse_prop(string $line): array {
  // "NAME;PARAM=VAL;PARAM2=VAL2:VALUE"
  $line = trim($line);
  $pos = strpos($line, ':');
  if ($pos === false) return ['name'=>$line,'params'=>[],'value'=>''];
  $lhs = substr($line,0,$pos);
  $value = substr($line,$pos+1);
  $parts = explode(';',$lhs);
  $name = strtoupper(array_shift($parts));
  $params=[];
  foreach ($parts as $p) {
    $kv = explode('=',$p,2);
    $k = strtoupper($kv[0]);
    $params[$k] = $kv[1] ?? '';
  }
  return ['name'=>$name,'params'=>$params,'value'=>$value];
}

/* -------------------- Fetch subscription row ------------------- */
try {
  $pdo = earthcal_get_pdo();

  $sub = $pdo->prepare("
    SELECT s.*, c.user_id, c.calendar_id
    FROM subscriptions_v1_tb s
    JOIN calendars_v1_tb c ON c.calendar_id = s.calendar_id
    WHERE s.subscription_id = :sid AND s.source_type = 'webcal' AND s.is_active = 1
    LIMIT 1
  ");
  $sub->execute(['sid'=>$subscriptionId]);
  $subscription = $sub->fetch(PDO::FETCH_ASSOC);

  if (!$subscription) {
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'subscription_not_found_or_inactive']); exit;
  }

  $calendarId = (int)$subscription['calendar_id'];
  $icalUrl    = preg_replace('/^webcal:/i','https:', (string)$subscription['url']);
  $importMode = (string)$subscription['import_mode'];   // 'merge' | 'replace'
  $scope      = (string)$subscription['import_scope'];  // 'all' | 'events' | 'todos' | 'journals'
  $etagOld    = (string)($subscription['last_etag'] ?? '');
  $lmOld      = (string)($subscription['last_modified_header'] ?? '');

  /* --------------- Conditional GET (cURL) ---------------- */
  $headers = ['User-Agent: EarthCal Sync/1.0'];
  if (!$forceFull) {
    if ($etagOld) $headers[] = 'If-None-Match: '.$etagOld;
    if ($lmOld)   $headers[] = 'If-Modified-Since: '.$lmOld;
  }

  $ch = curl_init();
  curl_setopt_array($ch, [
    CURLOPT_URL => $icalUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_HEADER => true
  ]);
  $resp = curl_exec($ch);
  if ($resp === false) throw new Exception('curl_error: '.curl_error($ch));
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $hdrSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $rawHeaders = substr($resp, 0, $hdrSize);
  $body = substr($resp, $hdrSize);
  curl_close($ch);

  // 304 → nothing to do
  if ($status === 304) {
    $pdo->prepare("UPDATE subscriptions_v1_tb
                   SET last_fetch_at = NOW(), last_http_status = 304, last_error = NULL
                   WHERE subscription_id = :sid")
        ->execute(['sid'=>$subscriptionId]);
    echo json_encode(['ok'=>true,'skipped'=>true,'reason'=>'not_modified']); exit;
  }

  if ($status < 200 || $status >= 300) {
    $pdo->prepare("UPDATE subscriptions_v1_tb
                   SET last_fetch_at = NOW(), last_http_status = :st, last_error = :err
                   WHERE subscription_id = :sid")
        ->execute(['sid'=>$subscriptionId,'st'=>$status,'err'=>"HTTP $status"]);
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'fetch_failed','detail'=>"HTTP $status"]); exit;
  }

  // Extract ETag / Last-Modified from headers
  $etagNew = null; $lmNew = null;
  foreach (explode("\n", str_replace("\r","",$rawHeaders)) as $h) {
    if (stripos($h,'ETag:')===0) $etagNew = trim(substr($h,5));
    if (stripos($h,'Last-Modified:')===0) $lmNew = trim(substr($h,13));
  }

  $body = normalize_ics_payload($body);

  // Basic ICS check
  if (stripos($body,'BEGIN:VCALENDAR') === false) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'not_ical']); exit;
  }

  /* ---------------- Parse ICS → components ---------------- */
  $components = split_components($body);
  $importThese = [];
  foreach ($components as $comp) {
    $kind = strtoupper($comp['name']);
    if (!in_array($kind, ['VEVENT','VTODO','VJOURNAL'], true)) continue;
    if ($scope !== 'all') {
      if ($scope==='events'   && $kind!=='VEVENT')   continue;
      if ($scope==='todos'    && $kind!=='VTODO')    continue;
      if ($scope==='journals' && $kind!=='VJOURNAL') continue;
    }
    $importThese[] = $comp;
  }

  /* ------------- Transform → items_v1_tb rows ------------- */
  $toUpsert = [];
  $seenUids = [];

  foreach ($importThese as $comp) {
    $kind = strtoupper($comp['name']);
    $type = ($kind==='VEVENT'?'event':($kind==='VTODO'?'todo':'journal'));

    $props = [];
    foreach ($comp['lines'] as $ln) {
      if ($ln==='' || $ln[0]===';') continue;
      $pp = parse_prop($ln);
      $props[] = $pp;
    }

    $map = [
      'UID'=>null,'SUMMARY'=>null,'DESCRIPTION'=>null,'LOCATION'=>null,'URL'=>null,
      'DTSTART'=>null,'DTEND'=>null,'DUE'=>null,'PERCENT-COMPLETE'=>null,
      'PRIORITY'=>null,'STATUS'=>null,'COMPLETED'=>null,'CLASS'=>null,
      'CATEGORIES'=>null,'GEO'=>null,'ORGANIZER'=>null,'TZID'=>null
    ];
    foreach ($props as $p) {
      $n = $p['name'];
      if (array_key_exists($n, $map) && $map[$n]===null) $map[$n]=$p;
    }

    $uid = trim((string)($map['UID']['value'] ?? ''));
    if ($uid==='') continue; // skip invalid
    $seenUids[$uid]=1;

    // DTSTART/DTEND/DUE
    $tzidStart = $map['DTSTART']['params']['TZID'] ?? null;
    $dtstart = $map['DTSTART']['value'] ?? null;
    $startParsed = $dtstart ? parse_ics_datetime($dtstart, $tzidStart) : ['utc'=>null,'all_day'=>0];

    $tzidEnd = $map['DTEND']['params']['TZID'] ?? $tzidStart;
    $dtend = $map['DTEND']['value'] ?? null;
    $endParsed = $dtend ? parse_ics_datetime($dtend, $tzidEnd) : ['utc'=>null,'all_day'=>0];

    $dueParsed = ['utc'=>null,'all_day'=>0];
    if (!empty($map['DUE']['value'])) {
      $dueParsed = parse_ics_datetime($map['DUE']['value'], $map['DUE']['params']['TZID'] ?? null);
    }

    // Categories → JSON array
    $categoriesJson = null;
    if (!empty($map['CATEGORIES']['value'])) {
      $cats = preg_split('/\s*,\s*/', trim($map['CATEGORIES']['value']));
      $categoriesJson = json_encode(array_values(array_filter($cats, fn($x)=>$x!=='')));
    }

    // GEO → lat;lon
    $lat = null; $lon = null;
    if (!empty($map['GEO']['value']) && strpos($map['GEO']['value'],';') !== false) {
      [$latStr, $lonStr] = explode(';', $map['GEO']['value'], 2);
      if (is_numeric($latStr) && is_numeric($lonStr)) {
        $lat = (float)$latStr; $lon = (float)$lonStr;
      }
    }

if ($uid==='') {
    error_log("Skipping component with missing UID: ".json_encode($comp));
    continue;
}


    $toUpsert[] = [
      'calendar_id'      => $calendarId,
      'uid'              => $uid,
      'component_type'   => $type,
      'summary'          => substr((string)($map['SUMMARY']['value'] ?? ''), 0, 1024),
      'description'      => $map['DESCRIPTION']['value'] ?? null,
      'location'         => $map['LOCATION']['value'] ?? null,
      'url'              => $map['URL']['value'] ?? null,
      'organizer'        => $map['ORGANIZER']['value'] ?? null,
      'tzid'             => $tzidStart ?: 'Etc/UTC',
      'dtstart_utc'      => $startParsed['utc'],
      'dtend_utc'        => $endParsed['utc'],
      'all_day'          => ($startParsed['all_day'] || $endParsed['all_day']) ? 1 : 0,
      'due_utc'          => $dueParsed['utc'],
      'percent_complete' => isset($map['PERCENT-COMPLETE']['value']) ? (int)$map['PERCENT-COMPLETE']['value'] : null,
      'priority'         => isset($map['PRIORITY']['value']) ? (int)$map['PRIORITY']['value'] : null,
      'status'           => $map['STATUS']['value'] ?? null,
      'completed_at'     => null,
      'classification'   => $map['CLASS']['value'] ?? null,
      'categories_json'  => $categoriesJson,
      'latitude'         => $lat,
      'longitude'        => $lon,
      'extras'           => null,
      'raw_ics'          => null,
    ];
  }

  /* ----------------- Upsert into items_v1_tb ----------------- */
  $pdo->beginTransaction();

  // Fetch existing UIDs for this calendar
  $existingStmt = $pdo->prepare("SELECT uid, item_id FROM items_v1_tb WHERE calendar_id = :cid AND deleted_at IS NULL");
  $existingStmt->execute(['cid'=>$calendarId]);
  $existing = $existingStmt->fetchAll(PDO::FETCH_KEY_PAIR); // uid => item_id

  $ins = $pdo->prepare("
    INSERT INTO items_v1_tb
      (calendar_id, uid, component_type, summary, description, location, url, organizer, tzid,
       dtstart_utc, dtend_utc, all_day, due_utc, percent_complete, priority, status, completed_at,
       classification, categories_json, latitude, longitude, extras, raw_ics, created_at, updated_at)
    VALUES
      (:calendar_id, :uid, :component_type, :summary, :description, :location, :url, :organizer, :tzid,
       :dtstart_utc, :dtend_utc, :all_day, :due_utc, :percent_complete, :priority, :status, :completed_at,
       :classification, :categories_json, :latitude, :longitude, :extras, :raw_ics, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      component_type=VALUES(component_type),
      summary=VALUES(summary),
      description=VALUES(description),
      location=VALUES(location),
      url=VALUES(url),
      organizer=VALUES(organizer),
      tzid=VALUES(tzid),
      dtstart_utc=VALUES(dtstart_utc),
      dtend_utc=VALUES(dtend_utc),
      all_day=VALUES(all_day),
      due_utc=VALUES(due_utc),
      percent_complete=VALUES(percent_complete),
      priority=VALUES(priority),
      status=VALUES(status),
      completed_at=VALUES(completed_at),
      classification=VALUES(classification),
      categories_json=VALUES(categories_json),
      latitude=VALUES(latitude),
      longitude=VALUES(longitude),
      extras=VALUES(extras),
      raw_ics=VALUES(raw_ics),
      updated_at=NOW(),
      deleted_at=NULL
  ");

  $inserted = 0; $updated = 0;
  foreach ($toUpsert as $row) {
    $wasExisting = array_key_exists($row['uid'], $existing);
    $ins->execute($row);
    $wasExisting ? $updated++ : $inserted++;
  }

  // If REPLACE mode: soft-delete any items that were not present in the feed
  $deleted = 0;
  if ($importMode === 'replace') {
    if (!empty($existing)) {
      // Compute UIDs present now
      $present = array_column($toUpsert, 'uid');
      if (!empty($present)) {
        $place = implode(',', array_fill(0, count($present), '?'));
        $params = $present;
        array_unshift($params, $calendarId);
        $del = $pdo->prepare("
          UPDATE items_v1_tb
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE calendar_id = ?
            AND deleted_at IS NULL
            AND uid NOT IN ($place)
        ");
        $del->execute($params);
        $deleted = $del->rowCount();
      }
    }
  }

  // Update subscription diagnostics
  $bytes = strlen($body);
  $upd = $pdo->prepare("
    UPDATE subscriptions_v1_tb
    SET last_fetch_at = NOW(),
        last_http_status = :st,
        last_etag = :etag,
        last_modified_header = :lm,
        bytes_fetched = :bytes,
        items_imported = :count,
        last_error = NULL
    WHERE subscription_id = :sid
  ");
  $upd->execute([
    'st' => $status,
    'etag' => $etagNew,
    'lm' => $lmNew,
    'bytes' => $bytes,
    'count' => ($inserted+$updated),
    'sid' => $subscriptionId
  ]);

  $pdo->commit();

  echo json_encode([
    'ok' => true,
    'calendar_id' => $calendarId,
    'subscription_id' => $subscriptionId,
    'fetched_http' => $status,
    'bytes' => $bytes,
    'inserted' => $inserted,
    'updated' => $updated,
    'soft_deleted' => $deleted
  ]);

} catch (Throwable $e) {
  if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
