<?php
declare(strict_types=1);

require_once '../calconn_env.php';
require_once '../earthenAuth_helper.php';

header('Content-Type: application/json; charset=utf-8');

// ------------------------------------------------------
// CORS
// ------------------------------------------------------
$allowed_origins = [
    'https://ecobricks.org',
    'https://earthcal.app',
    'https://beta.earthcal.app',
    'http://localhost',
    'file://'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array(rtrim($origin, '/'), $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . rtrim($origin, '/'));
} elseif ($origin === '' || $origin === null) {
    header('Access-Control-Allow-Origin: *');
} else {
    http_response_code(403);
    echo json_encode(['ok'=>false,'error'=>'cors_denied']);
    exit;
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

// ------------------------------------------------------
// Input validation
// ------------------------------------------------------
$raw = file_get_contents('php://input');
$in  = json_decode($raw ?: '[]', true);
if (!is_array($in)) $in = $_POST;

$buwana_id = filter_var($in['buwana_id'] ?? null, FILTER_VALIDATE_INT);
if (!$buwana_id) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'buwana_id_required']);
    exit;
}

// ------------------------------------------------------
// Query all calendar sources
// ------------------------------------------------------
try {

    // === 1️⃣ Personal calendars owned by user ===
    $stmt1 = $pdo->prepare("
        SELECT c.calendar_id, c.name, c.default_my_calendar, c.description,
               c.cal_emoji, c.color, c.tzid, c.category, c.visibility,
               c.is_readonly, c.created_at, c.updated_at,
               s.subscription_id, s.is_active, s.display_enabled
        FROM calendars_v1_tb AS c
        LEFT JOIN subscriptions_v1_tb AS s
            ON s.user_id = c.user_id
           AND s.calendar_id = c.calendar_id
           AND s.source_type = 'personal'
        WHERE c.user_id = :uid
        ORDER BY c.default_my_calendar DESC, c.name ASC
    ");
    $stmt1->execute(['uid' => $buwana_id]);
    $personal = $stmt1->fetchAll();

    // === 2️⃣ Public Earthcal calendars the user follows ===
    $stmt2 = $pdo->prepare("
        SELECT s.subscription_id, s.display_enabled, s.is_active,
               s.color, s.emoji, s.earthcal_calendar_id AS calendar_id,
               c.name, c.description, c.cal_emoji, c.color AS cal_color,
               c.tzid, c.category, c.visibility, c.is_readonly,
               c.created_at, c.updated_at
        FROM subscriptions_v1_tb AS s
        INNER JOIN calendars_v1_tb AS c
                ON s.earthcal_calendar_id = c.calendar_id
        WHERE s.user_id = :uid
          AND s.source_type = 'earthcal'
    ");
    $stmt2->execute(['uid' => $buwana_id]);
    $earthcal = $stmt2->fetchAll();

    // === 3️⃣ External Webcal feeds ===
    $stmt3 = $pdo->prepare("
        SELECT s.subscription_id, s.calendar_id, s.display_enabled, s.is_active,
               s.url, s.feed_title AS name, s.color, s.emoji,
               s.refresh_interval_minutes, s.last_fetch_at, s.last_error
        FROM subscriptions_v1_tb AS s
        WHERE s.user_id = :uid
          AND s.source_type = 'webcal'
    ");
    $stmt3->execute(['uid' => $buwana_id]);
    $webcals = $stmt3->fetchAll();

    // ------------------------------------------------------
    // Merge all results into a consistent schema
    // ------------------------------------------------------
    $normalize = static function(array $r, string $source): array {
        return [
            'calendar_id'    => isset($r['calendar_id']) ? (int)$r['calendar_id'] : null,
            'subscription_id' => isset($r['subscription_id']) ? (int)$r['subscription_id'] : null,
            'name'            => $r['name'] ?? '(Unnamed)',
            'description'    => $r['description'] ?? null,
            'emoji'          => $r['emoji'] ?? $r['cal_emoji'] ?? '📅',
            'color'          => $r['color'] ?? $r['cal_color'] ?? '#3b82f6',
            'tzid'           => $r['tzid'] ?? 'Etc/UTC',
            'category'       => $r['category'] ?? 'personal',
            'visibility'     => $r['visibility'] ?? 'private',
            'is_readonly'    => isset($r['is_readonly']) ? (bool)$r['is_readonly'] : ($source !== 'personal'),
            'is_default'     => (isset($r['default_my_calendar']) && (int)$r['default_my_calendar'] === 1),
            'display_enabled'=> isset($r['display_enabled']) ? (bool)$r['display_enabled'] : true,
            'source_type'    => $source,
            'is_active'      => isset($r['is_active']) ? (bool)$r['is_active'] : true,
            'url'            => $r['url'] ?? null,
            'feed_title'     => $r['feed_title'] ?? null,
            'created_at'     => $r['created_at'] ?? null,
            'updated_at'     => $r['updated_at'] ?? null,
            'last_fetch_at'  => $r['last_fetch_at'] ?? null,
            'last_error'     => $r['last_error'] ?? null,
        ];
    };

    $combined = [];
    foreach ($personal as $r) $combined[] = $normalize($r, 'personal');
    foreach ($earthcal as $r) $combined[] = $normalize($r, 'earthcal');
    foreach ($webcals as $r)  $combined[] = $normalize($r, 'webcal');

    echo json_encode([
        'ok' => true,
        'count' => count($combined),
        'calendars' => $combined
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage()
    ]);
}
?>
