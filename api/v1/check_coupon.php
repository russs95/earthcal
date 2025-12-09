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
if (!$buwanaId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'buwana_id_required']);
    exit;
}

$couponCodeRaw = strtoupper(trim((string)($payload['coupon_code'] ?? '')));
$couponCodeSanitized = preg_replace('/[^A-Z0-9]/', '', $couponCodeRaw ?? '');
$couponCode = $couponCodeSanitized ?? '';

if (strlen($couponCode) !== 7) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'invalid_coupon_format',
        'error_message' => 'Coupon codes must be exactly seven letters or numbers.'
    ]);
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

$respondError = function (int $status, string $error, ?string $message = null) use ($pdo): void {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code($status);
    $response = ['ok' => false, 'error' => $error];
    if ($message !== null) {
        $response['error_message'] = $message;
    }
    echo json_encode($response);
    exit;
};

require_once __DIR__ . '/../earthcal_plan_helpers.php';

try {
    $pdo->beginTransaction();

    $couponStmt = $pdo->prepare(
        'SELECT coupon_id, code, description, discount_type, discount_value, currency, plan_id, max_redemptions, redemptions_used, expires_at, is_active
           FROM coupon_codes_tb
          WHERE code = ?
          LIMIT 1
          FOR UPDATE'
    );
    $couponStmt->execute([$couponCode]);
    $couponRow = $couponStmt->fetch(PDO::FETCH_ASSOC);

    if (!$couponRow) {
        $respondError(404, 'coupon_not_found', 'We could not find that coupon code.');
    }

    if ((int)$couponRow['is_active'] !== 1) {
        $respondError(400, 'coupon_inactive', 'That coupon is no longer active.');
    }

    if ($couponRow['expires_at'] !== null) {
        $expiresAt = strtotime((string)$couponRow['expires_at']);
        if ($expiresAt !== false && $expiresAt <= time()) {
            $respondError(400, 'coupon_expired', 'That coupon has expired.');
        }
    }

    $maxRedemptions = $couponRow['max_redemptions'] !== null ? (int)$couponRow['max_redemptions'] : null;
    $redemptionsUsed = (int)$couponRow['redemptions_used'];

    if ($maxRedemptions !== null && $redemptionsUsed >= $maxRedemptions) {
        $respondError(400, 'coupon_redeemed_out', 'That coupon has already been redeemed the maximum number of times.');
    }

    $planId = isset($couponRow['plan_id']) ? (int)$couponRow['plan_id'] : null;
    if (!$planId) {
        $respondError(500, 'coupon_missing_plan', 'This coupon is not linked to a subscription plan.');
    }

    $userStmt = $pdo->prepare('SELECT buwana_id FROM users_tb WHERE buwana_id = ? LIMIT 1');
    $userStmt->execute([$buwanaId]);
    if (!$userStmt->fetchColumn()) {
        $respondError(404, 'user_not_found', 'We could not find that user.');
    }

    $planStmt = $pdo->prepare(
        'SELECT plan_id, name, slug, description, price_cents, currency, billing_interval, duration_days, is_active, created_at, updated_at
           FROM plans_tb
          WHERE plan_id = ?
          LIMIT 1'
    );
    $planStmt->execute([$planId]);
    $planRow = $planStmt->fetch(PDO::FETCH_ASSOC);

    if (!$planRow) {
        $respondError(404, 'plan_not_found', 'The plan linked to this coupon could not be found.');
    }

    $subscriptionStmt = $pdo->prepare(
        "SELECT subscription_id, user_id, plan_id, status, is_gift, coupon_code, external_provider, external_subscription_id, start_at, current_period_end, cancel_at, canceled_at, created_at, updated_at\n"
        . "  FROM user_subscriptions_tb\n"
        . " WHERE user_id = ?\n"
        . " ORDER BY\n"
        . "      CASE\n"
        . "          WHEN status IN ('active', 'trial', 'past_due') THEN 0\n"
        . "          ELSE 1\n"
        . "      END,\n"
        . "      updated_at DESC\n"
        . "  LIMIT 1\n"
        . "  FOR UPDATE"
    );
    $subscriptionStmt->execute([$buwanaId]);
    $subscriptionRow = $subscriptionStmt->fetch(PDO::FETCH_ASSOC);

    $couponExpiresAt = $couponRow['expires_at'] ?? null;

    if ($subscriptionRow) {
        $updateStmt = $pdo->prepare(
            "UPDATE user_subscriptions_tb\n"
            . "   SET plan_id = :plan_id,\n"
            . "       status = 'active',\n"
            . "       coupon_code = :coupon_code,\n"
            . "       current_period_end = :current_period_end,\n"
            . "       updated_at = NOW()\n"
            . " WHERE subscription_id = :subscription_id"
        );
        $updateStmt->execute([
            'plan_id' => $planId,
            'coupon_code' => $couponCode,
            'current_period_end' => $couponExpiresAt,
            'subscription_id' => (int)$subscriptionRow['subscription_id'],
        ]);
        $subscriptionId = (int)$subscriptionRow['subscription_id'];
    } else {
        $insertStmt = $pdo->prepare(
            "INSERT INTO user_subscriptions_tb\n"
            . "    (user_id, plan_id, status, coupon_code, start_at, current_period_end, created_at, updated_at)\n"
            . " VALUES\n"
            . "    (:user_id, :plan_id, 'active', :coupon_code, NOW(), :current_period_end, NOW(), NOW())"
        );
        $insertStmt->execute([
            'user_id' => $buwanaId,
            'plan_id' => $planId,
            'coupon_code' => $couponCode,
            'current_period_end' => $couponExpiresAt,
        ]);
        $subscriptionId = (int)$pdo->lastInsertId();
    }

    $couponUpdateStmt = $pdo->prepare(
        'UPDATE coupon_codes_tb
            SET redemptions_used = redemptions_used + 1,
                updated_at = NOW()
          WHERE coupon_id = ?'
    );
    $couponUpdateStmt->execute([(int)$couponRow['coupon_id']]);

    $subscriptionFetch = $pdo->prepare(
        "SELECT subscription_id, user_id, plan_id, status, is_gift, coupon_code, external_provider, external_subscription_id, start_at, current_period_end, cancel_at, canceled_at, created_at, updated_at\n"
        . "  FROM user_subscriptions_tb\n"
        . " WHERE subscription_id = ?\n"
        . " LIMIT 1"
    );
    $subscriptionFetch->execute([$subscriptionId]);
    $updatedSubscription = $subscriptionFetch->fetch(PDO::FETCH_ASSOC);

    if (!$updatedSubscription) {
        $respondError(500, 'subscription_update_failed', 'We could not update the subscription.');
    }

    $pdo->commit();

    $normalizedPlan = earthcal_normalize_plan($planRow);

    $couponResponse = [
        'coupon_id' => (int)$couponRow['coupon_id'],
        'code' => $couponRow['code'],
        'description' => $couponRow['description'] ?? null,
        'discount_type' => $couponRow['discount_type'],
        'discount_value' => number_format((float)$couponRow['discount_value'], 2, '.', ''),
        'currency' => $couponRow['currency'],
        'plan_id' => $planId,
        'max_redemptions' => $maxRedemptions,
        'redemptions_used' => $redemptionsUsed + 1,
        'expires_at' => $couponRow['expires_at'],
        'is_active' => true,
    ];

    $subscriptionResponse = [
        'subscription_id' => (int)$updatedSubscription['subscription_id'],
        'user_id' => (int)$updatedSubscription['user_id'],
        'plan_id' => (int)$updatedSubscription['plan_id'],
        'status' => $updatedSubscription['status'] ?? 'active',
        'is_gift' => isset($updatedSubscription['is_gift']) ? ((int)$updatedSubscription['is_gift']) === 1 : false,
        'coupon_code' => $updatedSubscription['coupon_code'] ?? null,
        'external_provider' => $updatedSubscription['external_provider'] ?? null,
        'external_subscription_id' => $updatedSubscription['external_subscription_id'] ?? null,
        'start_at' => $updatedSubscription['start_at'] ?? null,
        'current_period_end' => $updatedSubscription['current_period_end'] ?? null,
        'cancel_at' => $updatedSubscription['cancel_at'] ?? null,
        'canceled_at' => $updatedSubscription['canceled_at'] ?? null,
        'created_at' => $updatedSubscription['created_at'] ?? null,
        'updated_at' => $updatedSubscription['updated_at'] ?? null,
    ];

    echo json_encode([
        'ok' => true,
        'message' => 'Coupon applied successfully.',
        'coupon' => $couponResponse,
        'subscription' => $subscriptionResponse,
        'plan' => $normalizedPlan,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'detail' => $e->getMessage()]);
}
