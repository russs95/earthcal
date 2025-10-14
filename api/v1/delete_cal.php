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
if ($origin !== '' && in_array(rtrim($origin, '/'), $allowed_origins, true)) {
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

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$buwanaId   = filter_var($input['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$calendarId = filter_var($input['calendar_id'] ?? null, FILTER_VALIDATE_INT);

if (!$buwanaId || !$calendarId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_parameters']);
    exit;
}

try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'db_connect_failed',
        'detail' => $e->getMessage(),
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'SELECT calendar_id, user_id FROM calendars_v1_tb WHERE calendar_id = ? LIMIT 1'
    );
    $stmt->execute([$calendarId]);
    $calendar = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$calendar || (int)$calendar['user_id'] !== $buwanaId) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'calendar_not_found']);
        exit;
    }

    $deleteStmt = $pdo->prepare(
        'DELETE FROM calendars_v1_tb WHERE calendar_id = ? AND user_id = ? LIMIT 1'
    );
    $deleteStmt->execute([$calendarId, $buwanaId]);

    if ($deleteStmt->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'delete_failed']);
        exit;
    }

    $pdo->commit();

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage(),
    ]);
}
