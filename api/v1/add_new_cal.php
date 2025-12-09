<?php


declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

/* ============================================================
   EARTHCAL v1 | add_new_cal.php
   Create a new user calendar (non-default).
   ------------------------------------------------------------
   Expected JSON Payload:
   {
     "buwana_id": 123,
     "name": "Astronomy Calendar",
     "description": "Track lunar and planetary cycles",
     "emoji": "🌕",
     "color": "#4f46e5",
     "category": "astronomy",
     "visibility": "public",
     "tzid": "Asia/Jakarta"
   }
   ============================================================ */

// -------------------------------------------------------------
//  Earthcal.app server-based APIs CORS Setup
// -------------------------------------------------------------
$allowed_origins = [
    'https://earthcal.app',
    // EarthCal desktop / local dev:
    'http://127.0.0.1:3000',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// If this is a CORS request (Origin header present)…
if ($origin !== '') {
    $normalized_origin = rtrim($origin, '/');

    if (in_array($normalized_origin, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $normalized_origin);
        header('Vary: Origin'); // best practice
    } else {
        // Explicitly reject unknown web origins
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'cors_denied']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        exit(0);
    }
} else {
    // No Origin header (e.g. curl, server-side) – no CORS needed
    // You can leave this branch empty or add minimal headers if you like.
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'invalid_method']);
    exit;
}


// -------------------------------------------------------------
// 1️⃣ Connect to database (PDO)
// -------------------------------------------------------------
try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'db_connect_failed','detail'=>$e->getMessage()]);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', '0'); // hide from HTTP output
ini_set('log_errors', '1');
ini_set('error_log', '/var/www/html/api/debug_add_cal.log');

error_log("---- add_new_cal.php triggered at " . date('c'));

try {
    $stmt = $pdo->query("SELECT NOW() AS test_time");
    error_log("✅ PDO test success: " . json_encode($stmt->fetch()));
} catch (PDOException $e) {
    error_log("❌ PDO test failed: " . $e->getMessage());
}


// -------------------------------------------------------------
// 2️⃣ Parse input
// -------------------------------------------------------------
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '[]', true);
if (!is_array($data)) $data = $_POST;

$buwana_id   = isset($data['buwana_id']) ? (int)$data['buwana_id'] : 0;
$name        = trim((string)($data['name'] ?? ''));
$description = trim((string)($data['description'] ?? ''));
$emoji       = trim((string)($data['emoji'] ?? '🌍'));
$color       = trim((string)($data['color'] ?? '#4f46e5'));
$category    = trim((string)($data['category'] ?? 'personal'));
$visibility  = trim((string)($data['visibility'] ?? 'private'));
$tzid        = trim((string)($data['tzid'] ?? 'Etc/UTC'));

if (!$buwana_id || $name === '') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'missing_fields','need'=>['buwana_id','name']]);
    exit;
}

// -------------------------------------------------------------
// 3️⃣ Helpers
// -------------------------------------------------------------
function rand_hex(int $bytes = 16): string { return bin2hex(random_bytes($bytes)); }
function rand_slug(int $len = 12): string {
    $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    $s=''; for($i=0;$i<$len;$i++) $s .= $alphabet[random_int(0, strlen($alphabet)-1)];
    return $s;
}
function make_internal_subscription_url(string $type, int $uid, int $calId): string {
    return sprintf('earthcal://%s/%d/%d', $type, $uid, $calId);
}

// -------------------------------------------------------------
// 4️⃣ Verify user exists
// -------------------------------------------------------------
try {
    $u = $pdo->prepare("SELECT buwana_id FROM users_tb WHERE buwana_id=? LIMIT 1");
    $u->execute([$buwana_id]);
    if (!$u->fetch()) {
        http_response_code(404);
        echo json_encode(['ok'=>false,'error'=>'user_not_found']);
        exit;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'user_lookup_failed','detail'=>$e->getMessage()]);
    exit;
}

// -------------------------------------------------------------
// 5️⃣ Create new calendar
// -------------------------------------------------------------
try {
    $pdo->beginTransaction();

    $slug = rand_slug(12);
    $feed = rand_hex(16);

    $stmt = $pdo->prepare("
        INSERT INTO calendars_v1_tb
            (user_id, name, default_my_calendar, description, cal_emoji, color,
             tzid, category, visibility, is_readonly, share_slug, feed_token,
             created_at, updated_at)
        VALUES
            (?, ?, 0, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([
        $buwana_id,
        $name,
        $description ?: null,
        $emoji,
        $color,
        $tzid,
        $category,
        $visibility,
        $slug,
        $feed
    ]);

    $newId = (int)$pdo->lastInsertId();

    $subscriptionUrl = make_internal_subscription_url('personal', $buwana_id, $newId);
    $sub = $pdo->prepare("
        INSERT INTO subscriptions_v1_tb
            (user_id, calendar_id, source_type, url, url_hash, is_active, display_enabled, created_at, updated_at)
        VALUES
            (?, ?, 'personal', ?, ?, 1, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            is_active = VALUES(is_active),
            display_enabled = VALUES(display_enabled),
            updated_at = VALUES(updated_at)
    ");
    $sub->execute([
        $buwana_id,
        $newId,
        $subscriptionUrl,
        hash('sha256', $subscriptionUrl),
    ]);

    $pdo->commit();

    // Retrieve inserted calendar for confirmation
    $fetch = $pdo->prepare("SELECT * FROM calendars_v1_tb WHERE calendar_id=? LIMIT 1");
    $fetch->execute([$newId]);
    $calendar = $fetch->fetch();

    echo json_encode([
        'ok' => true,
        'created' => true,
        'calendar' => $calendar,
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'calendar_create_failed','detail'=>$e->getMessage()]);
}
