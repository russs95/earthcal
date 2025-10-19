<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
    'https://ecobricks.org',
    'https://earthcal.app',
    'https://beta.earthcal.app',
    'http://localhost',
    'file://'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== null) {
    $normalizedOrigin = rtrim($origin, '/');
    if (in_array($normalizedOrigin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $normalizedOrigin);
    } else {
        http_response_code(403);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'cors_denied']);
        exit;
    }
} else {
    header('Access-Control-Allow-Origin: *');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'invalid_method']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$buwanaId = filter_var($input['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$calendarId = filter_var($input['calendar_id'] ?? $input['cal_id'] ?? null, FILTER_VALIDATE_INT);
$subscriptionId = filter_var($input['subscription_id'] ?? null, FILTER_VALIDATE_INT);

if (!$buwanaId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'buwana_id_required']);
    exit;
}

if (!$calendarId && !$subscriptionId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'identifier_required']);
    exit;
}

try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'success' => false,
        'error' => 'db_connect_failed',
        'detail' => $e->getMessage(),
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    $userStmt = $pdo->prepare('SELECT buwana_id FROM users_tb WHERE buwana_id = ? LIMIT 1');
    $userStmt->execute([$buwanaId]);
    if (!$userStmt->fetchColumn()) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'user_not_found']);
        exit;
    }

    if ($calendarId) {
        $calendarStmt = $pdo->prepare(
            'SELECT calendar_id, visibility FROM calendars_v1_tb WHERE calendar_id = ? LIMIT 1'
        );
        $calendarStmt->execute([$calendarId]);
        $calendarRow = $calendarStmt->fetch(PDO::FETCH_ASSOC);

        if (!$calendarRow) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['ok' => false, 'success' => false, 'error' => 'calendar_not_found']);
            exit;
        }

        if (($calendarRow['visibility'] ?? '') !== 'public') {
            $pdo->rollBack();
            http_response_code(403);
            echo json_encode(['ok' => false, 'success' => false, 'error' => 'calendar_not_public']);
            exit;
        }
    }

    if (!$subscriptionId) {
        $lookup = $pdo->prepare(
            'SELECT subscription_id
               FROM subscriptions_v1_tb
              WHERE user_id = :uid
                AND source_type = \'earthcal\'
                AND earthcal_calendar_id = :cid
              LIMIT 1'
        );
        $lookup->execute([
            'uid' => $buwanaId,
            'cid' => $calendarId,
        ]);
        $subscriptionId = (int)$lookup->fetchColumn();
    } else {
        $check = $pdo->prepare(
            'SELECT subscription_id, earthcal_calendar_id
               FROM subscriptions_v1_tb
              WHERE subscription_id = :sid
                AND user_id = :uid
                AND source_type = \'earthcal\'
              LIMIT 1'
        );
        $check->execute([
            'sid' => $subscriptionId,
            'uid' => $buwanaId,
        ]);
        $row = $check->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['ok' => false, 'success' => false, 'error' => 'subscription_not_found']);
            exit;
        }
        if (!$calendarId) {
            $calendarId = (int)$row['earthcal_calendar_id'];
        }
    }

    if (!$subscriptionId) {
        $pdo->commit();
        echo json_encode([
            'ok' => true,
            'success' => true,
            'subscribed' => false,
            'calendar_id' => $calendarId ? (int)$calendarId : null,
            'subscription_id' => null,
            'message' => 'subscription_not_found'
        ]);
        exit;
    }

    $deleteStmt = $pdo->prepare('DELETE FROM subscriptions_v1_tb WHERE subscription_id = :sid');
    $deleteStmt->execute(['sid' => $subscriptionId]);

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'success' => true,
        'subscribed' => false,
        'calendar_id' => $calendarId ? (int)$calendarId : null,
        'subscription_id' => (int)$subscriptionId,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'success' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage(),
    ]);
}
