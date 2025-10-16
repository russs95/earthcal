<?php
declare(strict_types=1);

require_once '../pdo_connect.php';
require_once '../earthenAuth_helper.php';

header('Content-Type: application/json; charset=utf-8');

$allowed_origins = [
    'https://ecobricks.org',
    'https://earthcal.app',
    'https://beta.earthcal.app',
    'http://localhost',
    'file://'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== null) {
    $trimmedOrigin = rtrim($origin, '/');
    if (in_array($trimmedOrigin, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $trimmedOrigin);
    } else {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'cors_denied']);
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
    echo json_encode(['ok' => false, 'error' => 'invalid_method']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '[]', true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$buwanaId = filter_var($payload['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$sourceType = isset($payload['source_type']) ? strtolower(trim((string)$payload['source_type'])) : '';
$isActiveRaw = $payload['is_active'] ?? null;

$boolFilter = static function ($value): ?bool {
    if (is_bool($value)) {
        return $value;
    }
    if ($value === 1 || $value === '1' || $value === 'true' || $value === 'TRUE' || $value === 'on') {
        return true;
    }
    if ($value === 0 || $value === '0' || $value === 'false' || $value === 'FALSE' || $value === 'off') {
        return false;
    }
    return null;
};

$isActive = $boolFilter($isActiveRaw);

$calendarId = isset($payload['calendar_id']) ? filter_var($payload['calendar_id'], FILTER_VALIDATE_INT) : null;
$subscriptionId = isset($payload['subscription_id']) ? filter_var($payload['subscription_id'], FILTER_VALIDATE_INT) : null;

if (!$buwanaId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'buwana_id_required']);
    exit;
}

if (!in_array($sourceType, ['personal', 'earthcal', 'webcal'], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_source_type']);
    exit;
}

if ($isActive === null) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_is_active']);
    exit;
}

if ($sourceType === 'webcal' && !$subscriptionId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'subscription_id_required']);
    exit;
}

if ($sourceType !== 'webcal' && !$calendarId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'calendar_id_required']);
    exit;
}

try {
    $pdo = earthcal_get_pdo();
    $pdo->beginTransaction();

    $updated = 0;

    if ($sourceType === 'personal') {
        $stmt = $pdo->prepare(
            "UPDATE subscriptions_v1_tb
             SET is_active = :is_active, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = :uid AND calendar_id = :cid AND source_type = 'personal'"
        );
        $stmt->execute([
            'is_active' => $isActive ? 1 : 0,
            'uid' => $buwanaId,
            'cid' => $calendarId
        ]);
        $updated = $stmt->rowCount();

        if ($updated === 0) {
            $insert = $pdo->prepare(
                "INSERT INTO subscriptions_v1_tb
                 (user_id, calendar_id, source_type, is_active, display_enabled, created_at, updated_at)
                 VALUES (:uid, :cid, 'personal', :is_active, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            );
            $insert->execute([
                'uid' => $buwanaId,
                'cid' => $calendarId,
                'is_active' => $isActive ? 1 : 0
            ]);
            $updated = $insert->rowCount();
        }
    } elseif ($sourceType === 'earthcal') {
        $stmt = $pdo->prepare(
            "UPDATE subscriptions_v1_tb
             SET is_active = :is_active, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = :uid AND earthcal_calendar_id = :cid AND source_type = 'earthcal'"
        );
        $stmt->execute([
            'is_active' => $isActive ? 1 : 0,
            'uid' => $buwanaId,
            'cid' => $calendarId
        ]);
        $updated = $stmt->rowCount();

        if ($updated === 0) {
            $insert = $pdo->prepare(
                "INSERT INTO subscriptions_v1_tb
                 (user_id, earthcal_calendar_id, source_type, is_active, display_enabled, created_at, updated_at)
                 VALUES (:uid, :cid, 'earthcal', :is_active, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            );
            $insert->execute([
                'uid' => $buwanaId,
                'cid' => $calendarId,
                'is_active' => $isActive ? 1 : 0
            ]);
            $updated = $insert->rowCount();
        }
    } else { // webcal
        $stmt = $pdo->prepare(
            "UPDATE subscriptions_v1_tb
             SET is_active = :is_active, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = :uid AND subscription_id = :sid AND source_type = 'webcal'"
        );
        $stmt->execute([
            'is_active' => $isActive ? 1 : 0,
            'uid' => $buwanaId,
            'sid' => $subscriptionId
        ]);
        $updated = $stmt->rowCount();
    }

    $pdo->commit();

    if ($updated === 0) {
        echo json_encode(['ok' => false, 'error' => 'not_updated']);
        return;
    }

    echo json_encode([
        'ok' => true,
        'is_active' => $isActive,
        'source_type' => $sourceType,
        'calendar_id' => $calendarId,
        'subscription_id' => $subscriptionId
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage()
    ]);
}

