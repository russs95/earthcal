<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$allowed_origins = [
    'https://ecobricks.org',
    'https://earthcal.app',
    'https://beta.earthcal.app',
    'http://localhost',
    'file://'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array(rtrim($origin, '/'), $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . rtrim($origin, '/'));
} elseif ($origin === '' || $origin === null) {
    header('Access-Control-Allow-Origin: *');
} else {
    http_response_code(403);
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

try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect_failed', 'detail' => $e->getMessage()]);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$buwanaId   = filter_var($input['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$calendarId = filter_var($input['calendar_id'] ?? null, FILTER_VALIDATE_INT);

$name = trim((string)($input['name']
    ?? $input['calendar_name']
    ?? ''));
$description = trim((string)($input['description']
    ?? $input['calendar_description']
    ?? ''));
$category = strtolower(trim((string)($input['category']
    ?? $input['calendar_category']
    ?? '')));
$visibility = strtolower(trim((string)($input['visibility']
    ?? $input['calendar_visibility']
    ?? '')));
$color = trim((string)($input['color']
    ?? $input['calendar_color']
    ?? ''));
$emoji = trim((string)($input['emoji']
    ?? $input['cal_emoji']
    ?? $input['calendar_emoji']
    ?? ''));

if (!$buwanaId || !$calendarId || $name === '') {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'missing_required_fields',
        'need' => ['buwana_id', 'calendar_id', 'name']
    ]);
    exit;
}

$allowedCategories = ['personal', 'holidays', 'birthdays', 'astronomy', 'migration', 'other'];
if (!in_array($category, $allowedCategories, true)) {
    $category = 'personal';
}

$visibility = $visibility === 'public' ? 'public' : 'private';

if (!preg_match('/^#([0-9a-f]{6}|[0-9a-f]{3})$/i', $color)) {
    $color = '#3b82f6';
}

if ($emoji === '') {
    $emoji = '📅';
}

$emoji = mb_substr($emoji, 0, 8, 'UTF-8');
$description = $description !== '' ? $description : null;

try {
    $lookup = $pdo->prepare('SELECT user_id FROM calendars_v1_tb WHERE calendar_id = :calendar_id LIMIT 1');
    $lookup->execute(['calendar_id' => $calendarId]);
    $calendar = $lookup->fetch(PDO::FETCH_ASSOC);

    if (!$calendar) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'calendar_not_found']);
        exit;
    }

    if ((int)$calendar['user_id'] !== $buwanaId) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden']);
        exit;
    }

    $update = $pdo->prepare('
        UPDATE calendars_v1_tb
           SET name = :name,
               description = :description,
               category = :category,
               visibility = :visibility,
               cal_emoji = :emoji,
               color = :color,
               updated_at = NOW()
         WHERE calendar_id = :calendar_id
         LIMIT 1
    ');

    $update->execute([
        'name' => $name,
        'description' => $description,
        'category' => $category,
        'visibility' => $visibility,
        'emoji' => $emoji,
        'color' => $color,
        'calendar_id' => $calendarId,
    ]);

    $fetch = $pdo->prepare('SELECT * FROM calendars_v1_tb WHERE calendar_id = :calendar_id LIMIT 1');
    $fetch->execute(['calendar_id' => $calendarId]);
    $updated = $fetch->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'calendar' => $updated,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'update_failed',
        'detail' => $e->getMessage(),
    ]);
}
