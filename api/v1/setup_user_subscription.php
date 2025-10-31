<?php
declare(strict_types=1);

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

$planSlug = trim((string)($payload['plan_slug'] ?? 'padwan'));
if ($planSlug === '') {
    $planSlug = 'padwan';
}

try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect_failed', 'detail' => $e->getMessage()]);
    exit;
}

try {
    $pdo->beginTransaction();

    $planStmt = $pdo->prepare('SELECT plan_id FROM plans_tb WHERE slug = ? LIMIT 1');
    $planStmt->execute([$planSlug]);
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

    $subscriptionStmt = $pdo->prepare(
        'SELECT subscription_id, user_id, plan_id, status, is_gift, coupon_code, external_provider,
                external_subscription_id, start_at, current_period_end, cancel_at, canceled_at,
                created_at, updated_at
           FROM user_subscriptions_tb
          WHERE user_id = ? AND plan_id = ?
          LIMIT 1'
    );
    $subscriptionStmt->execute([$buwanaId, $planId]);
    $existingSubscription = $subscriptionStmt->fetch(PDO::FETCH_ASSOC);

    $created = false;
    $updated = false;

    if ($existingSubscription) {
        $updateStmt = $pdo->prepare(
            "UPDATE user_subscriptions_tb
                SET status = 'active', updated_at = NOW()
              WHERE subscription_id = ?"
        );
        $updateStmt->execute([$existingSubscription['subscription_id']]);
        $updated = true;
    } else {
        $insertStmt = $pdo->prepare(
            "INSERT INTO user_subscriptions_tb
                (user_id, plan_id, status, start_at, created_at, updated_at)
             VALUES
                (?, ?, 'active', NOW(), NOW(), NOW())"
        );
        $insertStmt->execute([$buwanaId, $planId]);
        $created = true;
        $updated = true;
    }

    $subscriptionStmt->execute([$buwanaId, $planId]);
    $subscriptionRow = $subscriptionStmt->fetch(PDO::FETCH_ASSOC);

    $pdo->commit();

    if (!$subscriptionRow) {
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'error' => 'subscription_fetch_failed',
        ]);
        exit;
    }

    $subscription = [
        'subscription_id' => isset($subscriptionRow['subscription_id'])
            ? (int)$subscriptionRow['subscription_id']
            : null,
        'user_id' => isset($subscriptionRow['user_id'])
            ? (int)$subscriptionRow['user_id']
            : $buwanaId,
        'plan_id' => isset($subscriptionRow['plan_id'])
            ? (int)$subscriptionRow['plan_id']
            : (int)$planId,
        'status' => $subscriptionRow['status'] ?? 'active',
        'is_gift' => isset($subscriptionRow['is_gift'])
            ? ((int)$subscriptionRow['is_gift']) === 1
            : false,
        'coupon_code' => $subscriptionRow['coupon_code'] ?? null,
        'external_provider' => $subscriptionRow['external_provider'] ?? null,
        'external_subscription_id' => $subscriptionRow['external_subscription_id'] ?? null,
        'start_at' => $subscriptionRow['start_at'] ?? null,
        'current_period_end' => $subscriptionRow['current_period_end'] ?? null,
        'cancel_at' => $subscriptionRow['cancel_at'] ?? null,
        'canceled_at' => $subscriptionRow['canceled_at'] ?? null,
        'created_at' => $subscriptionRow['created_at'] ?? null,
        'updated_at' => $subscriptionRow['updated_at'] ?? null,
    ];

    echo json_encode([
        'ok' => true,
        'created' => $created,
        'updated' => $updated,
        'plan_slug' => $planSlug,
        'subscription' => $subscription,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'detail' => $e->getMessage()]);
}
