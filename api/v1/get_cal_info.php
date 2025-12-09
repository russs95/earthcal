<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$allowed_origins = [
    'https://earthcal.app',
    // EarthCal desktop / local dev:
    'http://127.0.0.1:3000',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array(rtrim($origin, '/'), $allowed_origins, true)) {
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

$buwanaId   = isset($input['buwana_id']) ? (int)$input['buwana_id'] : 0;
$calendarId = isset($input['calendar_id']) ? (int)$input['calendar_id'] : 0;

if ($calendarId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'calendar_id_required']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        'SELECT c.calendar_id, c.user_id, c.name, c.description, c.category, c.visibility,
                c.created_at, c.updated_at, c.cal_emoji, c.color,
                u.first_name, u.last_name, u.full_name
         FROM calendars_v1_tb c
         LEFT JOIN users_tb u ON u.buwana_id = c.user_id
         WHERE c.calendar_id = ?
         LIMIT 1'
    );
    $stmt->execute([$calendarId]);
    $calendar = $stmt->fetch();

    if (!$calendar) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'calendar_not_found']);
        exit;
    }

    $isOwner   = $buwanaId > 0 && (int)$calendar['user_id'] === $buwanaId;
    $isPublic  = $calendar['visibility'] === 'public';
    $isAllowed = $isOwner || $isPublic;

    if (!$isAllowed) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'calendar_forbidden']);
        exit;
    }

    $countStmt = $pdo->prepare(
        'SELECT COUNT(*) AS item_count
           FROM items_v1_tb
          WHERE calendar_id = ?
            AND deleted_at IS NULL'
    );
    $countStmt->execute([$calendarId]);
    $itemCount = (int)($countStmt->fetch()['item_count'] ?? 0);

    $response = [
        'calendar_id'  => (int)$calendar['calendar_id'],
        'name'         => $calendar['name'],
        'description'  => $calendar['description'],
        'category'     => $calendar['category'],
        'visibility'   => $calendar['visibility'],
        'created_at'   => $calendar['created_at'],
        'updated_at'   => $calendar['updated_at'],
        'emoji'        => $calendar['cal_emoji'],
        'color'        => $calendar['color'],
        'item_count'   => $itemCount,
        'is_owner'     => $isOwner,
        'owner'        => null,
    ];

    if ($isPublic) {
        $response['owner'] = [
            'buwana_id' => (int)$calendar['user_id'],
            'first_name' => $calendar['first_name'],
            'last_name' => $calendar['last_name'],
            'full_name' => $calendar['full_name'],
        ];
    }

    echo json_encode(['ok' => true, 'calendar' => $response], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage(),
    ]);
}
