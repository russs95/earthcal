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

function ec_limit_text(?string $value, int $maxLength, string $fallback = ''): string {
    $value = trim((string)$value);
    if ($value === '') {
        return $fallback;
    }
    if (function_exists('mb_strlen')) {
        if (mb_strlen($value) > $maxLength) {
            return mb_substr($value, 0, $maxLength);
        }
        return $value;
    }
    if (strlen($value) > $maxLength) {
        return substr($value, 0, $maxLength);
    }
    return $value;
}

function ec_sanitize_hex_color(?string $color, string $default = '#3b82f6'): string {
    $color = trim((string)$color);
    if ($color === '') {
        return strtoupper($default);
    }
    if (preg_match('/^#([0-9a-fA-F]{6})$/', $color)) {
        return strtoupper($color);
    }
    if (preg_match('/^#([0-9a-fA-F]{3})$/', $color)) {
        $expanded = '#';
        for ($i = 1; $i < 4; $i++) {
            $expanded .= str_repeat($color[$i], 2);
        }
        return strtoupper($expanded);
    }
    return strtoupper($default);
}

function ec_sanitize_emoji(?string $emoji, string $default = '📅'): string {
    $emoji = trim((string)$emoji);
    if ($emoji === '') {
        return $default;
    }
    if (function_exists('mb_substr')) {
        return mb_substr($emoji, 0, 4);
    }
    return substr($emoji, 0, 4);
}

function ec_detect_provider(string $url): string {
    $host = strtolower((string)parse_url($url, PHP_URL_HOST));
    if ($host === '') {
        return 'EarthCal';
    }
    if (str_contains($host, 'google.com')) {
        return 'Google';
    }
    if (str_contains($host, 'icloud.com') || str_contains($host, 'apple.com')) {
        return 'Apple';
    }
    return 'EarthCal';
}

function ec_normalize_visibility(?string $visibility): string {
    $visibility = strtolower(trim((string)$visibility));
    $allowed = ['private', 'unlisted', 'public'];
    return in_array($visibility, $allowed, true) ? $visibility : 'private';
}

function ec_normalize_category(?string $category): string {
    $category = strtolower(trim((string)$category));
    $allowed = ['personal','holidays','birthdays','astronomy','migration','other'];
    return in_array($category, $allowed, true) ? $category : 'other';
}

function ec_fetch_calendar(PDO $pdo, int $calendarId): ?array {
    $stmt = $pdo->prepare('SELECT * FROM calendars_v1_tb WHERE calendar_id = ? LIMIT 1');
    $stmt->execute([$calendarId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function ec_fetch_subscription(PDO $pdo, int $subscriptionId): ?array {
    $stmt = $pdo->prepare('SELECT * FROM subscriptions_v1_tb WHERE subscription_id = ? LIMIT 1');
    $stmt->execute([$subscriptionId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

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
$name     = ec_limit_text($data['calendar_name'] ?? '', 120, 'Unnamed Calendar');
$desc     = ec_limit_text($data['calendar_description'] ?? '', 480, '');
$emoji    = ec_sanitize_emoji($data['calendar_emoji'] ?? '📅');
$color    = ec_sanitize_hex_color($data['calendar_color'] ?? '#3b82f6');
$visibility = ec_normalize_visibility($data['calendar_visibility'] ?? 'private');
$category = ec_normalize_category($data['calendar_category'] ?? 'other');

if (!$buwanaId || !$icalUrl) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'missing_required_fields']);
    exit;
}

/* Normalize and hash URL */
$icalUrl = preg_replace('/^webcal:/i', 'https:', $icalUrl);

if (!filter_var($icalUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'invalid_url']);
    exit;
}

$urlHash = hash('sha256', $icalUrl);
$provider = ec_detect_provider($icalUrl);

try {
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'db_connect_failed','detail'=>$e->getMessage()]);
    exit;
}

try {
    $userStmt = $pdo->prepare('SELECT buwana_id, time_zone FROM users_tb WHERE buwana_id = ? LIMIT 1');
    $userStmt->execute([$buwanaId]);
    $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);
    if (!$userRow) {
        http_response_code(404);
        echo json_encode(['ok'=>false,'error'=>'user_not_found']);
        exit;
    }
    $userTz = trim((string)($userRow['time_zone'] ?? ''));
    if ($userTz === '') {
        $userTz = 'Etc/UTC';
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'user_lookup_failed','detail'=>$e->getMessage()]);
    exit;
}

$descForInsert = $desc !== '' ? $desc : null;
$feedTitle = ec_limit_text($data['feed_title'] ?? $name, 160, $name);

$calendarId = null;
$subscriptionId = null;

try {
    $pdo->beginTransaction();

    $check = $pdo->prepare(
        "SELECT s.subscription_id, c.calendar_id
         FROM subscriptions_v1_tb s
         JOIN calendars_v1_tb c ON s.calendar_id = c.calendar_id
         WHERE s.user_id = :uid AND s.url_hash = :url_hash"
    );
    $check->execute(['uid' => $buwanaId, 'url_hash' => $urlHash]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $calendarId = (int)$existing['calendar_id'];
        $subscriptionId = (int)$existing['subscription_id'];
        $calendarRow = ec_fetch_calendar($pdo, $calendarId);
        $subscriptionRow = ec_fetch_subscription($pdo, $subscriptionId);

        if ($subscriptionRow && strcasecmp((string)($subscriptionRow['provider'] ?? ''), $provider) !== 0) {
            $updateProvider = $pdo->prepare(
                'UPDATE subscriptions_v1_tb SET provider = :provider, updated_at = NOW() WHERE subscription_id = :sid'
            );
            $updateProvider->execute([
                'provider' => $provider,
                'sid' => $subscriptionId
            ]);
            $subscriptionRow['provider'] = $provider;
        }

        $pdo->commit();
        echo json_encode([
            'ok' => true,
            'existing' => true,
            'calendar_id' => $calendarId,
            'subscription_id' => $subscriptionId,
            'calendar' => $calendarRow,
            'subscription' => $subscriptionRow,
            'message' => 'Already subscribed to this feed.'
        ]);
        exit;
    }

    $calInsert = $pdo->prepare(
        "INSERT INTO calendars_v1_tb
            (user_id, name, default_my_calendar, description, cal_emoji, color,
             tzid, category, visibility, is_readonly, provider, created_at, updated_at)
         VALUES
            (:uid, :name, 0, :desc, :emoji, :color,
             :tzid, :category, :visibility, 1, :provider, NOW(), NOW())"
    );
    $calInsert->execute([
        'uid' => $buwanaId,
        'name' => $name,
        'desc' => $descForInsert,
        'emoji' => $emoji,
        'color' => $color,
        'category' => $category,
        'visibility' => $visibility,
        'tzid' => $userTz,
        'provider' => $provider
    ]);
    $calendarId = (int)$pdo->lastInsertId();

    $subInsert = $pdo->prepare(
        "INSERT INTO subscriptions_v1_tb
            (user_id, calendar_id, source_type, url, url_hash,
             feed_title, is_active, display_enabled,
             import_mode, import_scope, refresh_interval_minutes,
             provider, created_at, updated_at)
         VALUES
            (:uid, :cal_id, 'webcal', :url, :url_hash,
             :feed_title, 1, 1,
             'merge', 'all', 360,
             :provider, NOW(), NOW())"
    );
    $subInsert->execute([
        'uid' => $buwanaId,
        'cal_id' => $calendarId,
        'url' => $icalUrl,
        'url_hash' => $urlHash,
        'feed_title' => $feedTitle,
        'provider' => $provider
    ]);
    $subscriptionId = (int)$pdo->lastInsertId();

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage()
    ]);
    exit;
}

$calendarRow = $calendarId ? ec_fetch_calendar($pdo, $calendarId) : null;
$subscriptionRow = $subscriptionId ? ec_fetch_subscription($pdo, $subscriptionId) : null;

echo json_encode([
    'ok' => true,
    'calendar_id' => $calendarId,
    'subscription_id' => $subscriptionId,
    'feed_title' => $feedTitle,
    'calendar' => $calendarRow,
    'subscription' => $subscriptionRow,
    'message' => 'Calendar and subscription successfully created.'
]);

?>
