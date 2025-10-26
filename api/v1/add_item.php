<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

/* ============================================================
   EARTHCAL v1 | add_item.php  (PDO version)
   Adds a new To-Do / Event / Journal entry for a user.
   Updated: 2025-10-09
   ============================================================ */

// -------------------------------------------------------------
//  0️⃣ CORS Setup (consistent with your other v1 APIs)
// -------------------------------------------------------------
$allowed_origins = [
    'https://ecobricks.org',
    'https://earthcal.app',
    'http://localhost',
    'file://'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array(rtrim($origin, '/'), $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . rtrim($origin, '/'));
} elseif (empty($origin)) {
    header('Access-Control-Allow-Origin: *');
} else {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(['ok' => false, 'error' => 'cors_denied']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'invalid_method']);
    exit;
}

// -------------------------------------------------------------
//  1️⃣ Database connection (via PDO)
// -------------------------------------------------------------
try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect_failed', 'detail' => $e->getMessage()]);
    exit;
}

// -------------------------------------------------------------
//  2️⃣ Parse & validate input
// -------------------------------------------------------------
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '[]', true);
if (!is_array($data)) $data = $_POST;

$buwana_id   = isset($data['buwana_id']) ? (int)$data['buwana_id'] : 0;
$title       = mb_substr(trim((string)($data['title'] ?? '')), 0, 255);
$item_kind   = strtolower(trim((string)($data['item_kind'] ?? 'todo')));
$start_local = trim((string)($data['start_local'] ?? ''));
$end_local   = trim((string)($data['end_local'] ?? ''));
$tzid        = trim((string)($data['tzid'] ?? 'Etc/UTC'));
$calendar_id = isset($data['calendar_id']) && $data['calendar_id'] !== '' ? (int)$data['calendar_id'] : 0;

$all_day     = !empty($data['all_day']) ? 1 : 0;
$pinned      = !empty($data['pinned']) ? 1 : 0;
$emoji       = trim((string)($data['emoji'] ?? ''));
$color_hex   = trim((string)($data['color_hex'] ?? ($data['color'] ?? '')));
$notes       = trim((string)($data['notes'] ?? ''));
$duration_minutes = isset($data['duration_minutes']) && is_numeric($data['duration_minutes'])
    ? (int)$data['duration_minutes'] : null;
$location    = mb_substr(trim((string)($data['location'] ?? '')), 0, 512);
$url         = mb_substr(trim((string)($data['url'] ?? '')), 0, 1024);
$extras_input = $data['extras'] ?? null;
$categories_input = $data['categories'] ?? null;

if (!$buwana_id || $title === '' || $start_local === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_fields', 'need' => ['buwana_id','title','start_local']]);
    exit;
}

// -------------------------------------------------------------
//  3️⃣ Helpers
// -------------------------------------------------------------
function rand_hex(int $bytes = 16): string { return bin2hex(random_bytes($bytes)); }
function rand_slug(int $len = 12): string {
    $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    $s=''; for($i=0;$i<$len;$i++) $s .= $alphabet[random_int(0, strlen($alphabet)-1)];
    return $s;
}
function generate_uid(): string {
    try {
        return bin2hex(random_bytes(12)) . '@earthcal.app';
    } catch (Throwable $e) {
        return uniqid('', true) . '@earthcal.app';
    }
}
function to_utc(string $local, string $tzid): string {
    try { $tz = new DateTimeZone($tzid ?: 'Etc/UTC'); }
    catch (Throwable $e) { $tz = new DateTimeZone('Etc/UTC'); }
    $dt = new DateTime($local ?: 'now', $tz);
    $dt->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Y-m-d H:i:s');
}

// -------------------------------------------------------------
//  4️⃣ Resolve calendar_id (use existing, default, or create new)
// -------------------------------------------------------------
try {
    if ($calendar_id > 0) {
        $own = $pdo->prepare("SELECT calendar_id FROM calendars_v1_tb WHERE calendar_id=? AND user_id=? LIMIT 1");
        $own->execute([$calendar_id, $buwana_id]);
        if (!$own->fetch()) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'error' => 'calendar_forbidden']);
            exit;
        }
    } else {
        // Try default
        $def = $pdo->prepare("SELECT calendar_id FROM calendars_v1_tb WHERE user_id=? AND default_my_calendar=1 LIMIT 1");
        $def->execute([$buwana_id]);
        $defRow = $def->fetch();
        if ($defRow) {
            $calendar_id = (int)$defRow['calendar_id'];
        } else {
            // Create "My Calendar"
            $pdo->beginTransaction();
            $slug = rand_slug(12);
            $feed = rand_hex(16);
            $pdo->prepare("
                INSERT INTO calendars_v1_tb
                  (user_id, name, default_my_calendar, description, cal_emoji, color, tzid,
                   category, visibility, is_readonly, share_slug, feed_token, created_at, updated_at)
                VALUES
                  (?, 'My Calendar', 1, NULL, '📅', '#3b82f6', ?, 'personal', 'private', 0, ?, ?, NOW(), NOW())
            ")->execute([$buwana_id, $tzid, $slug, $feed]);
            $calendar_id = (int)$pdo->lastInsertId();

            $pdo->prepare("
                UPDATE calendars_v1_tb
                SET default_my_calendar = 0
                WHERE user_id=? AND calendar_id<>?
            ")->execute([$buwana_id, $calendar_id]);
            $pdo->commit();
        }
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'calendar_resolution_failed', 'detail' => $e->getMessage()]);
    exit;
}

// -------------------------------------------------------------
//  5️⃣ Compute UTC timestamps
// -------------------------------------------------------------
if ($all_day) {
    $datePart = substr($start_local, 0, 10);
    $start_ts_utc = to_utc($datePart . ' 00:00:00', $tzid);
    if ($end_local !== '') {
        $endDatePart = substr($end_local, 0, 10);
        $end_ts_utc = to_utc($endDatePart . ' 00:00:00', $tzid);
        if ((!$duration_minutes || $duration_minutes <= 0) && $end_ts_utc) {
            try {
                $start_local_dt = new DateTime($datePart . ' 00:00:00', new DateTimeZone($tzid ?: 'Etc/UTC'));
                $end_local_dt = new DateTime($endDatePart . ' 00:00:00', new DateTimeZone($tzid ?: 'Etc/UTC'));
                $diff_seconds = $end_local_dt->getTimestamp() - $start_local_dt->getTimestamp();
                if ($diff_seconds > 0) {
                    $duration_minutes = (int)round($diff_seconds / 60);
                }
            } catch (Throwable $e) {
                // ignore
            }
        }
    } else {
        $end_ts_utc = null;
    }
} else {
    $start_ts_utc = to_utc($start_local, $tzid);
    if ($end_local !== '') {
        $end_ts_utc = to_utc($end_local, $tzid);
        if (!$duration_minutes || $duration_minutes <= 0) {
            try {
                $start_local_dt = new DateTime($start_local, new DateTimeZone($tzid ?: 'Etc/UTC'));
                $end_local_dt = new DateTime($end_local, new DateTimeZone($tzid ?: 'Etc/UTC'));
                $diff_seconds = $end_local_dt->getTimestamp() - $start_local_dt->getTimestamp();
                if ($diff_seconds > 0) {
                    $duration_minutes = (int)round($diff_seconds / 60);
                }
            } catch (Throwable $e) {
                // ignore diff calculation errors
            }
        }
    } else {
        $end_ts_utc = null;
        if ($duration_minutes && $duration_minutes > 0) {
            $end_dt = new DateTime($start_ts_utc, new DateTimeZone('UTC'));
            $end_dt->modify('+' . $duration_minutes . ' minutes');
            $end_ts_utc = $end_dt->format('Y-m-d H:i:s');
        }
    }
}

$component_type = in_array($item_kind, ['todo','event','journal'], true) ? $item_kind : 'todo';
$due_ts_utc = ($component_type === 'todo') ? ($end_ts_utc ?: $start_ts_utc) : null;

if ($all_day && $duration_minutes && $duration_minutes > 0) {
    try {
        $start_dt = new DateTime($start_ts_utc, new DateTimeZone('UTC'));
        $start_dt->modify('+' . $duration_minutes . ' minutes');
        $computed_end = $start_dt->format('Y-m-d H:i:s');
        if (!$end_ts_utc || $computed_end > $end_ts_utc) {
            $end_ts_utc = $computed_end;
        }
    } catch (Throwable $e) {
        // ignore inability to compute end
    }
}

$extras_json = null;
if (is_array($extras_input)) {
    $filtered = [];
    foreach ($extras_input as $key => $value) {
        if (!is_string($key) || $key === '') continue;
        if (is_string($value)) {
            $value = trim($value);
        }
        if ($value === '' || $value === null) continue;
        $filtered[$key] = $value;
    }
    if (!empty($filtered)) {
        $extras_json = json_encode($filtered, JSON_UNESCAPED_UNICODE);
    }
} elseif (is_string($extras_input) && trim($extras_input) !== '') {
    $decoded = json_decode($extras_input, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $filtered = [];
        foreach ($decoded as $key => $value) {
            if (!is_string($key) || $key === '') continue;
            if (is_string($value)) {
                $value = trim($value);
            }
            if ($value === '' || $value === null) continue;
            $filtered[$key] = $value;
        }
        if (!empty($filtered)) {
            $extras_json = json_encode($filtered, JSON_UNESCAPED_UNICODE);
        }
    } else {
        $extras_json = json_encode(['value' => trim($extras_input)], JSON_UNESCAPED_UNICODE);
    }
}

$categories_json = null;
if (is_array($categories_input)) {
    $normalized = [];
    foreach ($categories_input as $value) {
        if (is_string($value)) {
            $value = trim($value);
        }
        if ($value === '' || $value === null) continue;
        $normalized[] = $value;
    }
    if (!empty($normalized)) {
        $categories_json = json_encode(array_values($normalized), JSON_UNESCAPED_UNICODE);
    }
} elseif (is_string($categories_input) && trim($categories_input) !== '') {
    $segments = array_map('trim', explode(',', $categories_input));
    $normalized = [];
    foreach ($segments as $val) {
        if ($val === '') continue;
        $normalized[] = $val;
    }
    if (!empty($normalized)) {
        $categories_json = json_encode(array_values($normalized), JSON_UNESCAPED_UNICODE);
    }
}

// -------------------------------------------------------------
//  6️⃣ Insert item into items_v1_tb
// -------------------------------------------------------------
try {
    // Fetch actual column names
    $cols = [];
    $res = $pdo->query("SHOW COLUMNS FROM items_v1_tb");
    foreach ($res as $r) {
        $cols[strtolower($r['Field'])] = strtolower($r['Type']);
    }

    // Candidate field map
$sanitized_url = $url;
if ($sanitized_url !== '' && !preg_match('/^[a-z][a-z0-9+\-.]*:\/\//i', $sanitized_url)) {
    $sanitized_url = 'https://' . ltrim($sanitized_url, '/');
}

$candidate = [
        'calendar_id'      => $calendar_id,
        'uid'              => generate_uid(),
        'component_type'   => $component_type,
        'summary'          => $title ?: null,
        'description'      => $notes ?: null,
        'location'         => $location !== '' ? $location : null,
        'url'              => $sanitized_url !== '' ? $sanitized_url : null,
        'tzid'             => $tzid,
        'dtstart_utc'      => $start_ts_utc,
        'dtend_utc'        => $end_ts_utc,
        'all_day'          => $all_day,
        'pinned'           => $pinned,
        'item_emoji'       => $emoji ?: null,
        'item_color'       => $color_hex ?: null,
        'due_utc'          => $due_ts_utc,
        'percent_complete' => ($component_type === 'todo') ? 0 : null,
        'status'           => ($component_type === 'todo') ? 'NEEDS-ACTION' : null,
        'extras'           => $extras_json,
        'categories_json'  => $categories_json,
    ];

    // Add timestamps if columns exist
    if (isset($cols['created_at'])) $candidate['created_at'] = gmdate('Y-m-d H:i:s');
    if (isset($cols['updated_at'])) $candidate['updated_at'] = gmdate('Y-m-d H:i:s');

    // Filter valid keys only
    $fields = [];
    $values = [];
    foreach ($candidate as $k => $v) {
        if (array_key_exists(strtolower($k), $cols)) {
            $fields[] = $k;
            $values[] = $v;
        }
    }

    if (empty($fields)) throw new Exception('No matching columns in items_v1_tb');

    $placeholders = implode(',', array_fill(0, count($fields), '?'));
    $sql = "INSERT INTO items_v1_tb (" . implode(',', $fields) . ") VALUES ($placeholders)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    $new_id = (int)$pdo->lastInsertId();

    echo json_encode([
        'ok' => true,
        'item_id' => $new_id,
        'calendar_id' => $calendar_id,
        'item_kind' => $component_type,
        'uid' => $candidate['uid'],
        'title' => $title,
        'start_ts_utc' => $start_ts_utc,
        'end_ts_utc' => $end_ts_utc,
        'start_local' => $start_local,
        'tzid' => $tzid,
        'pinned' => (bool)$pinned,
        'emoji' => $emoji ?: null,
        'color_hex' => $color_hex ?: null,
        'all_day' => (bool)$all_day,
        'location' => $location !== '' ? $location : null,
        'url' => $sanitized_url !== '' ? $sanitized_url : null,
        'notes' => $notes ?: null,
        'extras' => $extras_json ? json_decode($extras_json, true) : null,
        'categories' => $categories_json ? json_decode($categories_json, true) : null
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'insert_failed','detail'=>$e->getMessage()]);
}
