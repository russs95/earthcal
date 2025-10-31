<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Configure the CORS policy so trusted surfaces (web app, beta app, local dev)
// can call this endpoint directly from the browser.
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

// Exit early for preflight requests; the actual request will follow.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

// The endpoint only accepts POST payloads.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'invalid_method']);
    exit;
}

// Normalise the request body (JSON body preferred, but fall back to form-data
// for backwards compatibility) and collect optional customisation values.
$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$buwanaId = filter_var($input['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$calendarId = filter_var($input['calendar_id'] ?? $input['cal_id'] ?? null, FILTER_VALIDATE_INT);
$subscriptionId = filter_var($input['subscription_id'] ?? null, FILTER_VALIDATE_INT);

$color = isset($input['color']) && is_string($input['color']) ? trim($input['color']) : null;
$emoji = isset($input['emoji']) && is_string($input['emoji']) ? trim($input['emoji']) : null;

$subscribeCandidate = null;
$subscribeKeys = ['subscribe', 'subscribed', 'is_active', 'active', 'desired_active', 'enable', 'enabled'];
foreach ($subscribeKeys as $key) {
    if (array_key_exists($key, $input)) {
        $subscribeCandidate = $input[$key];
        break;
    }
}

if ($subscribeCandidate === null && array_key_exists('action', $input)) {
    $actionValue = strtolower(trim((string)$input['action']));
    if ($actionValue !== '') {
        $subscribeCandidate = !in_array($actionValue, ['unsubscribe', 'remove', 'delete', 'detach', 'disable', 'off'], true);
    }
}

$subscribeFlag = true;
if ($subscribeCandidate !== null) {
    if (is_bool($subscribeCandidate)) {
        $subscribeFlag = $subscribeCandidate;
    } elseif (is_numeric($subscribeCandidate)) {
        $subscribeFlag = ((int)$subscribeCandidate) !== 0;
    } elseif (is_string($subscribeCandidate)) {
        $normalized = strtolower(trim($subscribeCandidate));
        if (in_array($normalized, ['0', 'false', 'no', 'n', 'off', 'unsubscribe', 'remove', 'delete', 'disable', 'disabled'], true)) {
            $subscribeFlag = false;
        } elseif (in_array($normalized, ['1', 'true', 'yes', 'y', 'on', 'subscribe', 'subscribed', 'add', 'enable', 'enabled'], true)) {
            $subscribeFlag = true;
        }
    }
}

// Require the user identifier and, when subscribing, the target calendar.
if (!$buwanaId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'buwana_id_required']);
    exit;
}

if ($subscribeFlag && !$calendarId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'calendar_id_required']);
    exit;
}

// Connect to the EarthCal database and surface a consistent error response if
// that fails for any reason.
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
    // Ensure the calling user exists before attempting to change their
    // subscriptions to avoid orphan records.
    $pdo->beginTransaction();

    $userStmt = $pdo->prepare('SELECT buwana_id FROM users_tb WHERE buwana_id = ? LIMIT 1');
    $userStmt->execute([$buwanaId]);
    if (!$userStmt->fetchColumn()) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'user_not_found']);
        exit;
    }

    if ($subscribeFlag) {
        // Subscribe (or re-activate) flow: verify the calendar is public, then
        // either update the existing subscription row or create a new one with
        // the requested overrides.
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

    // Unsubscribe flow: look up an existing subscription by either explicit
    // subscription ID or calendar ID and remove it if present.
    $calendarRow = null;
    if ($calendarId) {
        $calendarStmt = $pdo->prepare(
            'SELECT calendar_id, visibility, name FROM calendars_v1_tb WHERE calendar_id = ? LIMIT 1'
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
        if (!$calendarId) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['ok' => false, 'success' => false, 'error' => 'identifier_required']);
            exit;
        }

        $lookup = $pdo->prepare(
            'SELECT subscription_id, earthcal_calendar_id
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
        $row = $lookup->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $subscriptionId = (int)$row['subscription_id'];
            if (!$calendarId) {
                $calendarId = (int)$row['earthcal_calendar_id'];
            }
        }
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
        ], JSON_UNESCAPED_UNICODE);
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
        'calendar_name' => $calendarRow['name'] ?? null,
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
