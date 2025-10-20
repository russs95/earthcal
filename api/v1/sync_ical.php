<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| sync_ical.php — EarthCal v1.0 (with detailed debug logging)
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

error_log("[sync_ical] ===== Starting sync for subscription_id={$subscriptionId}, forceFull=" . ($forceFull?'true':'false'));

/* -------------------- Helpers: dates & ICS --------------------- */
// (helpers unchanged)
function param_first(array $params, string $key): ?string {
  if (!isset($params[$key])) return null;
  $val = $params[$key];
  if (is_array($val)) {
    foreach ($val as $candidate) {
      $candidate = trim((string)$candidate);
      if ($candidate !== '') {
        return $candidate;
      }
    }
    return null;
  }
  $val = trim((string)$val);
  return $val === '' ? null : $val;
}

function sanitize_timezone(?string $tz, string $fallback = 'Etc/UTC'): string {
  $tz = $tz !== null ? trim($tz) : '';
  if ($tz === '') return $fallback;
  try {
    new DateTimeZone($tz);
    return $tz;
  } catch (Throwable $e) {
    return $fallback;
  }
}

function parse_ics_duration(?string $value): ?int {
  if ($value === null) return null;
  $value = trim($value);
  if ($value === '') return null;
  $sign = 1;
  if ($value[0] === '+') {
    $value = substr($value, 1);
  } elseif ($value[0] === '-') {
    $sign = -1;
    $value = substr($value, 1);
  }
  try {
    $interval = new DateInterval($value);
  } catch (Throwable $e) {
    return null;
  }
  $reference = new DateTimeImmutable('@0');
  $target = $reference->add($interval);
  return ($target->getTimestamp()) * $sign;
}

function parse_ics_datetime(string $val, ?string $propParamsTzid): array {
  $val = trim($val);
  if (preg_match('/^\d{8}$/', $val)) {
    $date = substr($val,0,4).'-'.substr($val,4,2).'-'.substr($val,6,2);
    $dt = new DateTime($date.' 00:00:00', new DateTimeZone($propParamsTzid ?: 'Etc/UTC'));
    $dt->setTimezone(new DateTimeZone('UTC'));
    return ['utc'=>$dt->format('Y-m-d H:i:s'), 'all_day'=>true];
  }
  if (preg_match('/^\d{8}T\d{6}Z$/', $val)) {
    $dt = DateTime::createFromFormat('Ymd\THis\Z', $val, new DateTimeZone('UTC'));
    return ['utc'=>$dt? $dt->format('Y-m-d H:i:s'): null, 'all_day'=>false];
  }
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
  $ics = preg_replace('/^\xEF\xBB\xBF/', '', $ics); // strip UTF-8 BOM
  $ics = str_replace(["\r\n", "\r"], "\n", $ics);
  // remove control characters except tab and newline
  $ics = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $ics);
  return $ics;
}

function unfold_ical(string $ics): array {
  $normalized = normalize_ics_payload($ics);
  $lines = explode("\n", $normalized);
  $unfolded = [];

  foreach ($lines as $line) {
    if ($line === '') {
      continue;
    }

    $firstChar = $line[0] ?? '';
    if (!empty($unfolded) && ($firstChar === ' ' || $firstChar === "\t")) {
      $unfolded[count($unfolded) - 1] .= ltrim($line);
    } else {
      $unfolded[] = rtrim($line, "\n");
    }
  }

  return $unfolded;
}

function split_components(string $ics): array {
  $lines = unfold_ical($ics);
  $stack = [];
  $topLevel = [];

  foreach ($lines as $line) {
    if ($line === '') continue;

    if (stripos($line, 'BEGIN:') === 0) {
      $name = strtoupper(trim(substr($line, 6)));
      $stack[] = ['name' => $name, 'lines' => [], 'children' => []];
      continue;
    }

    if (stripos($line, 'END:') === 0) {
      if (empty($stack)) {
        continue;
      }

      $name = strtoupper(trim(substr($line, 4)));
      $component = array_pop($stack);
      if ($component['name'] === '') {
        $component['name'] = $name;
      }

      if (!empty($stack)) {
        $parentIndex = count($stack) - 1;
        $stack[$parentIndex]['children'][] = $component;
      } else {
        $topLevel[] = $component;
      }
      continue;
    }

    if (!empty($stack)) {
      $stack[count($stack) - 1]['lines'][] = $line;
    }
  }

  $result = [];
  $flatten = function (array $component) use (&$result, &$flatten): void {
    $result[] = [
      'name'  => $component['name'],
      'lines' => $component['lines'],
    ];
    if (!empty($component['children'])) {
      foreach ($component['children'] as $child) {
        $flatten($child);
      }
    }
  };

  foreach ($topLevel as $component) {
    $flatten($component);
  }

  return $result;
}

function parse_prop(string $line): array {
  $line = trim($line);
  if ($line === '') {
    return ['name' => '', 'params' => [], 'value' => ''];
  }

  $parts = explode(':', $line, 2);
  $nameAndParams = $parts[0];
  $value = $parts[1] ?? '';

  $segments = explode(';', $nameAndParams);
  $name = strtoupper(array_shift($segments) ?? '');
  $params = [];

  foreach ($segments as $segment) {
    if ($segment === '') continue;
    if (strpos($segment, '=') === false) {
      $params[strtolower($segment)] = true;
      continue;
    }

    [$paramName, $paramValue] = explode('=', $segment, 2);
    $paramName = strtolower(trim($paramName));
    $paramValue = trim($paramValue);
    $paramValue = trim($paramValue, '"');
    $values = array_map(
      static function (string $val): string {
        $val = trim($val);
        $val = trim($val, '"');
        return strtr($val, [
          '\\n' => "\n",
          '\\N' => "\n",
          '\\,' => ',',
          '\\;' => ';',
          '\\\\' => '\\',
        ]);
      },
      explode(',', $paramValue)
    );
    $params[$paramName] = $values;
  }

  $value = strtr($value, [
    '\\n' => "\n",
    '\\N' => "\n",
    '\\,' => ',',
    '\\;' => ';',
    '\\\\' => '\\',
  ]);

  return [
    'name'   => $name,
    'params' => $params,
    'value'  => $value,
  ];
}

/* -------------------- Fetch subscription row ------------------- */
try {
  $pdo = earthcal_get_pdo();
  error_log("[sync_ical] DB connection established");

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
    error_log("[sync_ical] Subscription not found or inactive for id {$subscriptionId}");
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'subscription_not_found_or_inactive']); exit;
  }

  $calendarId = (int)$subscription['calendar_id'];
  $icalUrl    = preg_replace('/^webcal:/i','https:', (string)$subscription['url']);
  $providerName = trim((string)($subscription['provider'] ?? 'EarthCal'));
  error_log("[sync_ical] Fetched subscription record: calendar_id={$calendarId}, url={$icalUrl}");

  /* ---------------- Fetch ICS feed ---------------- */
  $headers = ['User-Agent: EarthCal Sync/1.0'];
  if (!$forceFull) {
    if (!empty($subscription['last_etag'])) $headers[] = 'If-None-Match: '.$subscription['last_etag'];
    if (!empty($subscription['last_modified_header'])) $headers[] = 'If-Modified-Since: '.$subscription['last_modified_header'];
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
  error_log("[sync_ical] HTTP {$status}, body length=".strlen($body));

  if ($status === 304) {
    error_log("[sync_ical] Feed not modified (304)");
    $pdo->prepare("UPDATE subscriptions_v1_tb
      SET last_fetch_at = NOW(), last_http_status = 304, last_error = NULL
      WHERE subscription_id = :sid")->execute(['sid'=>$subscriptionId]);
    echo json_encode(['ok'=>true,'skipped'=>true,'reason'=>'not_modified','provider'=>$providerName]); exit;
  }

  if ($status < 200 || $status >= 300) {
    error_log("[sync_ical] Fetch failed: HTTP {$status}");
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'fetch_failed','detail'=>"HTTP $status"]); exit;
  }

  if (stripos($body,'BEGIN:VCALENDAR') === false) {
    error_log("[sync_ical] Response missing BEGIN:VCALENDAR");
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'not_ical']); exit;
  }

  /* ---------------- Parse ICS → components ---------------- */
  $components = split_components($body);
  error_log("[sync_ical] Total components parsed=".count($components));

  $calendarDefaultTz = 'Etc/UTC';
  foreach ($components as $comp) {
    if (strtoupper($comp['name']) !== 'VCALENDAR') continue;
    foreach ($comp['lines'] as $line) {
      $prop = parse_prop($line);
      if ($prop['name'] === 'X-WR-TIMEZONE' && trim($prop['value']) !== '') {
        $calendarDefaultTz = sanitize_timezone($prop['value']);
        break 2;
      }
    }
  }

  $importThese = [];
  foreach ($components as $comp) {
    $kind = strtoupper($comp['name']);
    if (!in_array($kind, ['VEVENT','VTODO','VJOURNAL'], true)) continue;
    $importThese[] = $comp;
  }
  error_log("[sync_ical] Components to import=".count($importThese));

  /* ------------- Transform → items_v1_tb rows ------------- */
  $toUpsert = [];
  foreach ($importThese as $comp) {
    $props=[];
    foreach ($comp['lines'] as $ln) {
      if ($ln==='' || $ln[0]===';') continue;
      $props[] = parse_prop($ln);
    }
    $map=[];
    foreach ($props as $p){ $map[$p['name']]=$p; }
    $uid = trim((string)($map['UID']['value'] ?? ''));
    if ($uid==='') continue;
    $kind = strtoupper($comp['name']);
    $componentType = match ($kind) {
      'VTODO'    => 'todo',
      'VJOURNAL' => 'journal',
      default    => 'event',
    };

    $summary = $map['SUMMARY']['value'] ?? '';
    $description = $map['DESCRIPTION']['value'] ?? null;
    $location = $map['LOCATION']['value'] ?? null;
    $url = $map['URL']['value'] ?? null;
    $organizer = $map['ORGANIZER']['value'] ?? null;

    $tzid = $calendarDefaultTz;
    $dtstartUtc = null;
    $dtendUtc = null;
    $dueUtc = null;
    $allDay = 0;

    if (isset($map['DTSTART'])) {
      $startTz = sanitize_timezone(param_first($map['DTSTART']['params'], 'tzid'), $tzid);
      $parsedStart = parse_ics_datetime($map['DTSTART']['value'], $startTz);
      if (!empty($parsedStart['utc'])) {
        $dtstartUtc = $parsedStart['utc'];
        $tzid = $startTz;
      }
      if (!empty($parsedStart['all_day'])) {
        $allDay = 1;
      }
    }

    if (isset($map['DTEND'])) {
      $endTz = sanitize_timezone(param_first($map['DTEND']['params'], 'tzid'), $tzid);
      $parsedEnd = parse_ics_datetime($map['DTEND']['value'], $endTz);
      if (!empty($parsedEnd['utc'])) {
        $dtendUtc = $parsedEnd['utc'];
      }
      if (!empty($parsedEnd['all_day'])) {
        $allDay = 1;
      }
    } elseif ($dtstartUtc !== null && isset($map['DURATION'])) {
      $seconds = parse_ics_duration($map['DURATION']['value'] ?? null);
      if ($seconds !== null) {
        try {
          $start = new DateTime($dtstartUtc, new DateTimeZone('UTC'));
          $start->modify(($seconds >= 0 ? '+' : '').$seconds.' seconds');
          $dtendUtc = $start->format('Y-m-d H:i:s');
        } catch (Throwable $e) {
          $dtendUtc = null;
        }
      }
    }

    if ($componentType === 'todo' && isset($map['DUE'])) {
      $dueTz = sanitize_timezone(param_first($map['DUE']['params'], 'tzid'), $tzid);
      $parsedDue = parse_ics_datetime($map['DUE']['value'], $dueTz);
      if (!empty($parsedDue['utc'])) {
        $dueUtc = $parsedDue['utc'];
        if ($dtstartUtc === null) {
          $tzid = $dueTz;
        }
      }
      if (!empty($parsedDue['all_day'])) {
        $allDay = 1;
      }
    }

    $rawComponent = sprintf("BEGIN:%s\n%s\nEND:%s", $kind, implode("\n", $comp['lines']), $kind);

    $toUpsert[] = [
      'uid' => $uid,
      'component_type' => $componentType,
      'summary' => $summary,
      'description' => $description,
      'location' => $location,
      'url' => $url,
      'organizer' => $organizer,
      'tzid' => $tzid,
      'dtstart_utc' => $dtstartUtc,
      'dtend_utc' => $dtendUtc,
      'due_utc' => $dueUtc,
      'all_day' => $allDay,
      'raw_ics' => $rawComponent,
    ];
  }

  error_log("[sync_ical] Prepared ".count($toUpsert)." items with UID for upsert");
  $itemsPreview = array_map(
    static function (array $item): array {
      return array_intersect_key($item, array_flip([
        'uid','summary','component_type','dtstart_utc','dtend_utc','due_utc','all_day','tzid'
      ]));
    },
    array_slice($toUpsert, 0, 10)
  );

  /* ----------------- DB UPSERT ----------------- */
  $pdo->beginTransaction();
  $existingStmt = $pdo->prepare("SELECT uid, item_id FROM items_v1_tb WHERE calendar_id=:cid AND deleted_at IS NULL");
  $existingStmt->execute(['cid'=>$calendarId]);
  $existing = $existingStmt->fetchAll(PDO::FETCH_KEY_PAIR);
  error_log("[sync_ical] Existing items in DB=".count($existing));

  $ins = $pdo->prepare("
    INSERT INTO items_v1_tb
      (calendar_id, uid, component_type, summary, description, location, url, organizer, tzid, dtstart_utc, dtend_utc, due_utc, all_day, raw_ics, created_at, updated_at)
    VALUES (:calendar_id, :uid, :component_type, :summary, :description, :location, :url, :organizer, :tzid, :dtstart_utc, :dtend_utc, :due_utc, :all_day, :raw_ics, NOW(), NOW())
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
      due_utc=VALUES(due_utc),
      all_day=VALUES(all_day),
      raw_ics=VALUES(raw_ics),
      updated_at=NOW(),
      deleted_at=NULL
  ");

  $inserted=0; $updated=0;
  foreach($toUpsert as $r){
    $ins->execute([
      'calendar_id' => $calendarId,
      'uid' => $r['uid'],
      'component_type' => $r['component_type'],
      'summary' => $r['summary'],
      'description' => $r['description'],
      'location' => $r['location'],
      'url' => $r['url'],
      'organizer' => $r['organizer'],
      'tzid' => $r['tzid'],
      'dtstart_utc' => $r['dtstart_utc'],
      'dtend_utc' => $r['dtend_utc'],
      'due_utc' => $r['due_utc'],
      'all_day' => $r['all_day'],
      'raw_ics' => $r['raw_ics'],
    ]);
    if(array_key_exists($r['uid'],$existing)) $updated++; else $inserted++;
  }

  $pdo->commit();
  error_log("[sync_ical] Upsert complete: inserted={$inserted}, updated={$updated}");

  echo json_encode([
    'ok'=>true,
    'calendar_id'=>$calendarId,
    'subscription_id'=>$subscriptionId,
    'fetched_http'=>$status,
    'inserted'=>$inserted,
    'updated'=>$updated,
    'count_uid'=>count($toUpsert),
    'components'=>count($components),
    'items'=>$itemsPreview,
    'items_total'=>count($toUpsert),
    'provider'=>$providerName
  ]);

} catch (Throwable $e) {
  if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
  error_log("[sync_ical] Exception: ".$e->getMessage());
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
