<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| connect_ical.php — EarthCal v1.0
|--------------------------------------------------------------------------
| Purpose:
|   Takes confirmed feed data from the front-end and:
|     1. Creates a new calendar in calendars_v1_tb
|     2. Creates a corresponding webcal subscription in subscriptions_v1_tb
|     3. Returns both IDs and a success response
|
| Expected Input JSON:
| {
|   "buwana_id": 123,
|   "ical_url": "https://calendar.google.com/...basic.ics",
|   "calendar_name": "Holidays in Canada",
|   "calendar_description": "Official Canadian holidays",
|   "calendar_emoji": "🇨🇦",
|   "calendar_color": "#ff0000",
|   "calendar_visibility": "private",
|   "calendar_category": "holidays"
| }
|--------------------------------------------------------------------------
*/

require_once '../pdo_connect.php';
require_once '../earthenAuth_helper.php';
header('Content-Type: application/json; charset=utf-8');

/* ----------------------------- CORS ----------------------------- */
$allowed_origins = [
    'https://ecobricks.org',
    'https://earthcal.app',
    'https://beta.earthcal.app',
    'http://localhost',
    'file://'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== null) {
    $trimmed = rtrim($origin, '/');
    if (in_array($trimmed, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $trimmed);
    } else {
        http_response_code(403);
        echo json_encode(['ok'=>false,'error'=>'cors_denied']);
        exit;
    }
} else {
    header('Access-Control-Allow-Origin: *');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'error'=>'invalid_method']);
    exit;
}

/* --------------------------- INPUT ----------------------------- */
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '[]', true);
if (!is_array($data)) $data = $_POST;

$buwanaId = filter_var($data['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$icalUrl  = trim((string)($data['ical_url'] ?? ''));
$name     = trim((string)($data['calendar_name'] ?? 'Unnamed Calendar'));
$desc     = trim((string)($data['calendar_description'] ?? ''));
$emoji    = trim((string)($data['calendar_emoji'] ?? '📅'));
$color    = trim((string)($data['calendar_color'] ?? '#3b82f6'));
$visibility = in_array(($data['calendar_visibility'] ?? 'private'), ['private','unlisted','public'], true)
    ? $data['calendar_visibility']
    : 'private';
$category = in_array(($data['calendar_category'] ?? 'other'), ['personal','holidays','birthdays','astronomy','migration','other'], true)
    ? $data['calendar_category']
    : 'other';

if (!$buwanaId || !$icalUrl) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'missing_required_fields']);
    exit;
}

/* Normalize and hash URL */
$icalUrl = preg_replace('/^webcal:/i', 'https:', $icalUrl);
$urlHash = hash('sha256', $icalUrl);

try {
    $pdo = earthcal_get_pdo();
    $pdo->beginTransaction();

    // ---------------------------------------------------------------------
    // 1. Check if subscription already exists for this user+URL
    // ---------------------------------------------------------------------
    $check = $pdo->prepare("
        SELECT s.subscription_id, c.calendar_id
        FROM subscriptions_v1_tb s
        JOIN calendars_v1_tb c ON s.calendar_id = c.calendar_id
        WHERE s.user_id = :uid AND s.url_hash = :url_hash
    ");
    $check->execute(['uid'=>$buwanaId, 'url_hash'=>$urlHash]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $pdo->commit();
        echo json_encode([
            'ok'=>true,
            'existing'=>true,
            'calendar_id'=>(int)$existing['calendar_id'],
            'subscription_id'=>(int)$existing['subscription_id'],
            'message'=>'Already subscribed to this feed.'
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // 2. Insert into calendars_v1_tb
    // ---------------------------------------------------------------------
    $calInsert = $pdo->prepare("
        INSERT INTO calendars_v1_tb
            (user_id, name, default_my_calendar, description, cal_emoji, color,
             tzid, category, visibility, is_readonly, created_at, updated_at)
        VALUES
            (:uid, :name, 0, :desc, :emoji, :color,
             'Etc/UTC', :category, :visibility, 1, NOW(), NOW())
    ");
    $calInsert->execute([
        'uid' => $buwanaId,
        'name' => $name,
        'desc' => $desc,
        'emoji' => $emoji,
        'color' => $color,
        'category' => $category,
        'visibility' => $visibility
    ]);
    $calendarId = (int)$pdo->lastInsertId();

    // ---------------------------------------------------------------------
    // 3. Insert into subscriptions_v1_tb
    // ---------------------------------------------------------------------
    $subInsert = $pdo->prepare("
        INSERT INTO subscriptions_v1_tb
            (user_id, calendar_id, source_type, url, url_hash,
             feed_title, is_active, display_enabled,
             import_mode, import_scope, refresh_interval_minutes,
             created_at, updated_at)
        VALUES
            (:uid, :cal_id, 'webcal', :url, :url_hash,
             :feed_title, 1, 1,
             'merge', 'all', 360,
             NOW(), NOW())
    ");
    $subInsert->execute([
        'uid' => $buwanaId,
        'cal_id' => $calendarId,
        'url' => $icalUrl,
        'url_hash' => $urlHash,
        'feed_title' => $name
    ]);
    $subscriptionId = (int)$pdo->lastInsertId();

    // ---------------------------------------------------------------------
    // 4. Commit and respond
    // ---------------------------------------------------------------------
    $pdo->commit();
    echo json_encode([
        'ok' => true,
        'calendar_id' => $calendarId,
        'subscription_id' => $subscriptionId,
        'feed_title' => $name,
        'message' => 'Calendar and subscription successfully created.'
    ]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'ok'=>false,
        'error'=>'server_error',
        'detail'=>$e->getMessage()
    ]);
}
?>
