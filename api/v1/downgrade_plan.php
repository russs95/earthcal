<?php
declare(strict_types=1);


// NOT HOOKED UP


header('Content-Type: application/json; charset=utf-8');

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
if (!$buwanaId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'buwana_id_required']);
    exit;
}

require_once __DIR__ . '/../pdo_connect.php';

try {
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

$padwanSlug = 'padwan';

try {
    $pdo->beginTransaction();

    $planStmt = $pdo->prepare('SELECT plan_id FROM plans_tb WHERE slug = ? LIMIT 1');
    $planStmt->execute([$padwanSlug]);
    $planId = $planStmt->fetchColumn();

    if (!$planId) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'plan_not_found']);
        exit;
    }

    $userStmt = $pdo->prepare('SELECT buwana_id FROM users_tb WHERE buwana_id = ? LIMIT 1');
    $userStmt->execute([$buwanaId]);
    if (!$userStmt->fetchColumn()) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'user_not_found']);
        exit;
    }

    $cancelStmt = $pdo->prepare(
        "UPDATE user_subscriptions_tb\n"
        . "   SET status = 'canceled',\n"
        . "       cancel_at = CASE WHEN cancel_at IS NULL THEN NOW() ELSE cancel_at END,\n"
        . "       canceled_at = NOW(),\n"
        . "       updated_at = NOW()\n"
        . " WHERE user_id = ?\n"
        . "   AND plan_id <> ?\n"
        . "   AND status <> 'canceled'"
    );
    $cancelStmt->execute([$buwanaId, $planId]);
    $cancelledCount = $cancelStmt->rowCount();

    $subscriptionSelect = $pdo->prepare(
        'SELECT subscription_id, user_id, plan_id, status, is_gift, coupon_code, external_provider, external_subscription_id,'
        . ' start_at, current_period_end, cancel_at, canceled_at, created_at, updated_at'
        . ' FROM user_subscriptions_tb'
        . ' WHERE user_id = ? AND plan_id = ?'
        . ' LIMIT 1'
    );
    $subscriptionSelect->execute([$buwanaId, $planId]);
    $padwanSubscription = $subscriptionSelect->fetch(PDO::FETCH_ASSOC);

    $padwanCreated = false;
    if ($padwanSubscription) {
        $activateStmt = $pdo->prepare(
            "UPDATE user_subscriptions_tb\n"
            . "   SET status = 'active',\n"
            . "       coupon_code = NULL,\n"
            . "       cancel_at = NULL,\n"
            . "       canceled_at = NULL,\n"
            . "       current_period_end = NULL,\n"
            . "       updated_at = NOW()\n"
            . " WHERE subscription_id = ?"
        );
        $activateStmt->execute([$padwanSubscription['subscription_id']]);
    } else {
        $insertStmt = $pdo->prepare(
            "INSERT INTO user_subscriptions_tb\n"
            . "    (user_id, plan_id, status, start_at, created_at, updated_at)\n"
            . " VALUES\n"
            . "    (?, ?, 'active', NOW(), NOW(), NOW())"
        );
        $insertStmt->execute([$buwanaId, $planId]);
        $padwanCreated = true;
    }

    $subscriptionSelect->execute([$buwanaId, $planId]);
    $padwanRow = $subscriptionSelect->fetch(PDO::FETCH_ASSOC);

    $pdo->commit();

    if (!$padwanRow) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'subscription_fetch_failed']);
        exit;
    }

    $padwanResponse = [
        'subscription_id' => isset($padwanRow['subscription_id']) ? (int)$padwanRow['subscription_id'] : null,
        'user_id' => isset($padwanRow['user_id']) ? (int)$padwanRow['user_id'] : $buwanaId,
        'plan_id' => isset($padwanRow['plan_id']) ? (int)$padwanRow['plan_id'] : (int)$planId,
        'status' => $padwanRow['status'] ?? 'active',
        'is_gift' => isset($padwanRow['is_gift']) ? ((int)$padwanRow['is_gift'] === 1) : false,
        'coupon_code' => $padwanRow['coupon_code'] ?? null,
        'external_provider' => $padwanRow['external_provider'] ?? null,
        'external_subscription_id' => $padwanRow['external_subscription_id'] ?? null,
        'start_at' => $padwanRow['start_at'] ?? null,
        'current_period_end' => $padwanRow['current_period_end'] ?? null,
        'cancel_at' => $padwanRow['cancel_at'] ?? null,
        'canceled_at' => $padwanRow['canceled_at'] ?? null,
        'created_at' => $padwanRow['created_at'] ?? null,
        'updated_at' => $padwanRow['updated_at'] ?? null,
    ];

    echo json_encode([
        'ok' => true,
        'plan_slug' => $padwanSlug,
        'padwan_created' => $padwanCreated,
        'cancelled_other_subscriptions' => $cancelledCount,
        'subscription' => $padwanResponse,
    ]);
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
