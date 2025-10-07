<?php
declare(strict_types=1);

require_once '../earthenAuth_helper.php';
require_once '../buwanaconn_env.php'; // if you need $buwana_conn later
require_once '../calconn_env.php';    // provides $cal_conn (mysqli)

header('Content-Type: application/json; charset=utf-8');

/* -----------------------------------------------------------
 * CORS (same policy style you used before)
 * ---------------------------------------------------------*/
$allowed_origins = ['https://ecobricks.org', 'https://earthcal.app', 'http://localhost', 'file://'];
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

/* -----------------------------------------------------------
 * Read & validate JSON
 * Expected minimal payload for a To-Do:
 * {
 *   "buwana_id": 123,
 *   "calendar_id": 456,                 // optional; if missing we create or use default
 *   "item_kind": "todo",                // 'todo' | 'event' | 'journal' (todo by default)
 *   "title": "Buy rice",
 *   "start_local": "2025-10-06 09:00",  // local date time
 *   "tzid": "Asia/Jakarta",
 *   "all_day": false,
 *   "pinned": true,
 *   "emoji": "📝",
 *   "color_hex": "#3b82f6",
 *   "notes": "2kg jasmine"
 * }
 * ---------------------------------------------------------*/
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '[]', true);
if (!is_array($data)) $data = $_POST;

$buwana_id   = isset($data['buwana_id']) ? (int)$data['buwana_id'] : 0;
$title       = trim((string)($data['title'] ?? ''));
$item_kind   = strtolower(trim((string)($data['item_kind'] ?? 'todo')));
$start_local = trim((string)($data['start_local'] ?? ''));
$tzid        = trim((string)($data['tzid'] ?? 'Etc/UTC'));
$calendar_id = isset($data['calendar_id']) && $data['calendar_id'] !== '' ? (int)$data['calendar_id'] : 0;

$all_day     = !empty($data['all_day']) ? 1 : 0;
$pinned      = !empty($data['pinned']) ? 1 : 0;
$emoji       = trim((string)($data['emoji'] ?? ''));
$color_hex   = trim((string)($data['color_hex'] ?? ($data['color'] ?? '')));
$notes       = trim((string)($data['notes'] ?? ''));

if (!$buwana_id || $title === '' || $start_local === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_fields', 'need' => ['buwana_id','title','start_local']]);
    exit;
}

/* -----------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------*/
function rand_hex(int $bytes = 16): string { return bin2hex(random_bytes($bytes)); }
function rand_slug(int $len = 12): string {
    $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    $s=''; for($i=0;$i<$len;$i++) $s .= $alphabet[random_int(0, strlen($alphabet)-1)];
    return $s;
}

/** Convert local datetime + tzid → UTC 'Y-m-d H:i:s' */
function to_utc(string $local, string $tzid): string {
    try {
        $tz = @new DateTimeZone($tzid ?: 'Etc/UTC');
    } catch (Throwable $e) {
        $tz = new DateTimeZone('Etc/UTC');
    }
    $dt = new DateTime($local ?: 'now', $tz);
    $dt->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Y-m-d H:i:s');
}

/** mysqli prepared SELECT one row helper */
function mysqli_select_one(mysqli $db, string $sql, string $types = '', array $params = []) {
    $stmt = $db->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: '.$db->error);
    if ($types !== '' && $params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $stmt->close();
    return $row ?: null;
}

/** Execute prepared statement (INSERT/UPDATE) */
function mysqli_exec(mysqli $db, string $sql, string $types = '', array $params = []): int {
    $stmt = $db->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: '.$db->error);
    if ($types !== '' && $params) $stmt->bind_param($types, ...$params);
    $ok = $stmt->execute();
    if (!$ok) throw new Exception('Exec failed: '.$stmt->error);
    $id = $stmt->insert_id;
    $stmt->close();
    return $id;
}

/** Fetch set of column names for items table */
function get_items_columns(mysqli $db): array {
    $cols = [];
    $res = $db->query("SHOW COLUMNS FROM items_v1_tb");
    if ($res) {
        while ($r = $res->fetch_assoc()) {
            $cols[strtolower($r['Field'])] = strtolower($r['Type']);
        }
        $res->free();
    }
    return $cols;
}

/* -----------------------------------------------------------
 * Ensure we have a calendar_id: prefer provided one; else
 * use the user's default; if not exists, create "My Calendar".
 * Also verify the calendar belongs to this user.
 * ---------------------------------------------------------*/
try {
    // Validate existing calendar belongs to user (if provided)
    if ($calendar_id > 0) {
        $own = mysqli_select_one(
            $cal_conn,
            "SELECT calendar_id FROM calendars_v1_tb WHERE calendar_id=? AND user_id=? LIMIT 1",
            "ii",
            [$calendar_id, $buwana_id]
        );
        if (!$own) {
            http_response_code(403);
            echo json_encode(['ok'=>false,'error'=>'calendar_forbidden']);
            exit;
        }
    } else {
        // Try default
        $def = mysqli_select_one(
            $cal_conn,
            "SELECT calendar_id FROM calendars_v1_tb WHERE user_id=? AND default_my_calendar=1 LIMIT 1",
            "i",
            [$buwana_id]
        );
        if ($def) {
            $calendar_id = (int)$def['calendar_id'];
        } else {
            // Create "My Calendar"
            $slug = rand_slug(12);
            $feed = rand_hex(16);
            // rare collisions → retry a couple times
            $tries = 0;
            while ($tries < 3) {
                try {
                    $calendar_id = mysqli_exec(
                        $cal_conn,
                        "INSERT INTO calendars_v1_tb
                           (user_id, name, default_my_calendar, description, cal_emoji, color, tzid,
                            category, visibility, is_readonly, share_slug, feed_token, created_at, updated_at)
                         VALUES
                           (?,      'My Calendar', 1, NULL,       '📅',      '#3b82f6', ?,
                            'personal', 'private', 0, ?, ?, NOW(), NOW())",
                        "issss",
                        [$buwana_id, $tzid, $slug, $feed]
                    );
                    // Ensure uniqueness of default per user
                    mysqli_exec(
                        $cal_conn,
                        "UPDATE calendars_v1_tb SET default_my_calendar=0 WHERE user_id=? AND calendar_id<>?",
                        "ii",
                        [$buwana_id, $calendar_id]
                    );
                    break;
                } catch (Exception $e) {
                    if (strpos($e->getMessage(), 'Duplicate') !== false) {
                        $slug = rand_slug(12);
                        $feed = rand_hex(16);
                        $tries++;
                        continue;
                    }
                    throw $e;
                }
            }
        }
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'calendar_resolution_failed','detail'=>$e->getMessage()]);
    exit;
}

/* -----------------------------------------------------------
 * Compute UTC timestamps
 * - For all_day: normalize to local midnight → UTC
 * - For todo: end_ts_utc can be NULL; duration NULL
 * ---------------------------------------------------------*/
if ($all_day) {
    // If all_day, ignore time portion and use 00:00 local
    $datePart = substr($start_local, 0, 10); // YYYY-MM-DD
    $start_ts_utc = to_utc($datePart . ' 00:00:00', $tzid);
    $end_ts_utc   = null; // optional: could be +1d midnight if you want a span
} else {
    $start_ts_utc = to_utc($start_local, $tzid);
    $end_ts_utc   = null;
}
$duration_minutes = isset($data['duration_minutes']) && is_numeric($data['duration_minutes'])
    ? (int)$data['duration_minutes'] : null;

/* -----------------------------------------------------------
 * Build INSERT dynamically based on actual columns present.
 * This keeps the API resilient if the table has (color vs color_hex),
 * or has optional columns like 'completed'.
 * ---------------------------------------------------------*/
try {
    $cols = get_items_columns($cal_conn);

    // Preferred field names → values
    $candidate = [
        'user_id'          => $buwana_id,
        'calendar_id'      => $calendar_id,
        'item_kind'        => in_array($item_kind, ['todo','event','journal'], true) ? $item_kind : 'todo',
        'title'            => $title,
        'tzid'             => $tzid,
        'all_day'          => $all_day,
        'start_ts_utc'     => $start_ts_utc,
        'end_ts_utc'       => $end_ts_utc,
        'duration_minutes' => $duration_minutes,
        'notes'            => $notes === '' ? null : $notes,
        'pinned'           => $pinned,
        'emoji'            => $emoji === '' ? null : $emoji,
        'color_hex'        => $color_hex === '' ? null : $color_hex,
        'color'            => $color_hex === '' ? null : $color_hex, // fallback if table uses 'color'
        'completed'        => ($item_kind === 'todo') ? 0 : null,     // if column exists
    ];

    // Keep only keys that actually exist in table
    $fields = [];
    $values = [];
    $types  = '';
    foreach ($candidate as $k => $v) {
        if (!array_key_exists(strtolower($k), $cols)) continue;
        $fields[] = $k;
        $values[] = $v;
        $colType = $cols[strtolower($k)];
        // crude type mapping: ints as 'i', everything else as 's'
        if (strpos($colType, 'int') !== false) {
            $types .= 'i';
        } else {
            $types .= 's';
        }
    }

    if (empty($fields)) {
        throw new Exception('No matching columns to insert into items_v1_tb');
    }

    $placeholders = implode(',', array_fill(0, count($fields), '?'));
    $columnsSql   = implode(',', $fields);

    $sql = "INSERT INTO items_v1_tb ($columnsSql) VALUES ($placeholders)";
    $new_id = mysqli_exec($cal_conn, $sql, $types, $values);

    echo json_encode([
        'ok' => true,
        'item_id' => (int)$new_id,
        'calendar_id' => (int)$calendar_id,
        'item_kind' => $candidate['item_kind'],
        'start_ts_utc' => $start_ts_utc,
        'tzid' => $tzid,
        'pinned' => (bool)$pinned,
        'emoji' => $emoji ?: null,
        'color_hex' => $color_hex ?: null
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'insert_failed','detail'=>$e->getMessage()]);
}
