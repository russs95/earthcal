<?php

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

/* ============================================================
   EARTHCAL v1 APIS  | cal_active_toggle.php
   Toggle a subscription on/off for a user's calendar feed.
   ------------------------------------------------------------
   Expected JSON Payload:
   {
     "buwana_id": 123,
     "source_type": "personal" | "earthcal" | "webcal",
     "calendar_id": 42,            // for personal or earthcal sources
     "subscription_id": 77,        // for webcal sources
     "is_active": true
   }
   Successful Response:
   {
     "ok": true,
     "is_active": true,
     "source_type": "personal",
     "calendar_id": 42,
     "subscription_id": null
   }
   ============================================================ */

// -------------------------------------------------------------
// 0. Earthcal.app server-based APIs CORS Setup
// -------------------------------------------------------------

$allowed_origins = [
    'https://earthcal.app',
    'https://beta.earthcal.app',
    // EarthCal desktop / local dev:
    'http://127.0.0.1:3000',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// If this is a CORS request (Origin header present)…
if ($origin !== '') {
    $normalizedOrigin = rtrim($origin, '/');

    if (in_array($normalizedOrigin, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $normalizedOrigin);
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
// 1. Load dependencies and connect to database
// -------------------------------------------------------------
try {
    require_once __DIR__ . '/../pdo_connect.php';
    require_once __DIR__ . '/../earthenAuth_helper.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect_failed', 'detail' => $e->getMessage()]);
    exit;
}

// -------------------------------------------------------------
// 2. Parse input
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// 3. Validate input
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// 4. Update subscription active state
// -------------------------------------------------------------
try {
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

