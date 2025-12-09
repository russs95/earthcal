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

// Respond to CORS preflight requests without executing any business logic.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

// Only POST requests are permitted for this endpoint.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'invalid_method']);
    exit;
}

// Decode the JSON payload (or fall back to form data) and collect user intent.
$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$boolFilter = static function ($value): ?bool {
    if (is_bool($value)) {
        return $value;
    }

    if (is_numeric($value)) {
        return (int)$value === 1 ? true : ((int)$value === 0 ? false : null);
    }

    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        if (in_array($normalized, ['1', 'true', 'yes', 'on', 'subscribe'], true)) {
            return true;
        }
        if (in_array($normalized, ['0', 'false', 'no', 'off', 'unsubscribe'], true)) {
            return false;
        }
    }

    return null;
};

$buwanaId = filter_var($input['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$calendarId = filter_var($input['calendar_id'] ?? $input['cal_id'] ?? null, FILTER_VALIDATE_INT);
$subscribe = $boolFilter($input['subscribe'] ?? null);
$color = isset($input['color']) && is_string($input['color']) ? trim($input['color']) : null;
$emoji = isset($input['emoji']) && is_string($input['emoji']) ? trim($input['emoji']) : null;

// Validate required inputs before touching the database.
if (!$buwanaId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'buwana_id_required']);
    exit;
}

if (!$calendarId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'calendar_id_required']);
    exit;
}

if ($subscribe === null) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'subscribe_flag_invalid']);
    exit;
}

// Attempt a database connection and surface a predictable error if it fails.
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
    // Confirm the user exists and the requested calendar is public before
    // modifying subscription state.
    $pdo->beginTransaction();

    $userStmt = $pdo->prepare('SELECT buwana_id FROM users_tb WHERE buwana_id = ? LIMIT 1');
    $userStmt->execute([$buwanaId]);
    if (!$userStmt->fetchColumn()) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'user_not_found']);
        exit;
    }

    $calendarStmt = $pdo->prepare(
        'SELECT calendar_id, visibility, cal_emoji, color, name FROM calendars_v1_tb WHERE calendar_id = ? LIMIT 1'
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

    $subscriptionStmt = $pdo->prepare(
        'SELECT subscription_id, color, emoji, is_active, display_enabled
           FROM subscriptions_v1_tb
          WHERE user_id = :uid
            AND source_type = \'earthcal\'
            AND earthcal_calendar_id = :cid
          LIMIT 1'
    );
    $subscriptionStmt->execute([
        'uid' => $buwanaId,
        'cid' => $calendarId,
    ]);

    $existing = $subscriptionStmt->fetch(PDO::FETCH_ASSOC);
    $subscriptionId = $existing ? (int)$existing['subscription_id'] : null;

    $defaultColor = $calendarRow['color'] ?? '#3b82f6';
    $defaultEmoji = $calendarRow['cal_emoji'] ?? '📅';

    if ($subscribe) {
        // Subscribe (or reactivate) the calendar, preserving any existing color
        // and emoji choices unless overrides were supplied in the request.
        $colorToUse = $color !== null && $color !== '' ? $color : ($existing['color'] ?? $defaultColor);
        $emojiToUse = $emoji !== null && $emoji !== '' ? $emoji : ($existing['emoji'] ?? $defaultEmoji);

        if ($existing) {
            $updateStmt = $pdo->prepare(
                'UPDATE subscriptions_v1_tb
                    SET calendar_id = :cid,
                        is_active = 1,
                        display_enabled = 1,
                        color = :color,
                        emoji = :emoji,
                        updated_at = CURRENT_TIMESTAMP
                  WHERE subscription_id = :sid'
            );
            $updateStmt->execute([
                'cid' => $calendarId,
                'color' => $colorToUse,
                'emoji' => $emojiToUse,
                'sid' => $subscriptionId,
            ]);
        } else {
            $insertStmt = $pdo->prepare(
                'INSERT INTO subscriptions_v1_tb
                    (user_id, calendar_id, source_type, earthcal_calendar_id, color, emoji, is_active, display_enabled, created_at, updated_at)
                 VALUES
                    (:uid, :cid, \'earthcal\', :earthcal_cid, :color, :emoji, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
            );
            $insertStmt->execute([
                'uid' => $buwanaId,
                'cid' => $calendarId,
                'earthcal_cid' => $calendarId,
                'color' => $colorToUse,
                'emoji' => $emojiToUse,
            ]);
            $subscriptionId = (int)$pdo->lastInsertId();
        }

        $pdo->commit();

        echo json_encode([
            'ok' => true,
            'success' => true,
            'subscribed' => true,
            'calendar_id' => (int)$calendarRow['calendar_id'],
            'subscription_id' => $subscriptionId,
            'color' => $colorToUse,
            'emoji' => $emojiToUse,
            'calendar_name' => $calendarRow['name'] ?? null,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // When unsubscribing, deactivate an existing subscription so the user can
    // re-enable it later without losing their preferences.
    if ($existing) {
        $deactivateStmt = $pdo->prepare(
            'UPDATE subscriptions_v1_tb
                SET is_active = 0,
                    display_enabled = 0,
                    updated_at = CURRENT_TIMESTAMP
              WHERE subscription_id = :sid'
        );
        $deactivateStmt->execute(['sid' => $subscriptionId]);
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'success' => true,
        'subscribed' => false,
        'calendar_id' => (int)$calendarRow['calendar_id'],
        'subscription_id' => $subscriptionId,
    ], JSON_UNESCAPED_UNICODE);
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
