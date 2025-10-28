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

try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect_failed', 'detail' => $e->getMessage()]);
    exit;
}

require_once __DIR__ . '/../earthcal_plan_helpers.php';

try {
    $plans = earthcal_fetch_active_plans($pdo);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'plan_lookup_failed', 'detail' => $e->getMessage()]);
    exit;
}

$currentSubscription = null;

try {
    $subscriptionStmt = $pdo->prepare(
        "SELECT us.subscription_id, us.user_id, us.plan_id, us.status, us.is_gift, us.coupon_code,
                us.external_provider, us.external_subscription_id, us.start_at, us.current_period_end,
                us.cancel_at, us.canceled_at, us.created_at, us.updated_at,
                p.plan_id AS plan_plan_id, p.name AS plan_name, p.slug AS plan_slug, p.description AS plan_description,
                p.price_cents AS plan_price_cents, p.currency AS plan_currency, p.billing_interval AS plan_billing_interval,
                p.duration_days AS plan_duration_days, p.is_active AS plan_is_active, p.created_at AS plan_created_at,
                p.updated_at AS plan_updated_at
           FROM user_subscriptions_tb AS us
           JOIN plans_tb AS p ON p.plan_id = us.plan_id
          WHERE us.user_id = :uid
       ORDER BY
            CASE
                WHEN us.status IN ('active', 'trial', 'past_due')
                     AND (us.current_period_end IS NULL OR us.current_period_end >= NOW()) THEN 0
                WHEN us.status = 'canceled'
                     AND (us.cancel_at IS NULL OR us.cancel_at >= NOW()) THEN 1
                ELSE 2
            END,
            us.updated_at DESC
          LIMIT 1"
    );
    $subscriptionStmt->execute(['uid' => $buwanaId]);
    $row = $subscriptionStmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $currentSubscription = [
            'subscription_id'       => (int)$row['subscription_id'],
            'user_id'               => (int)$row['user_id'],
            'plan_id'               => (int)$row['plan_id'],
            'status'                => $row['status'] ?? 'active',
            'is_gift'               => ((int)$row['is_gift']) === 1,
            'coupon_code'           => $row['coupon_code'] ?? null,
            'external_provider'     => $row['external_provider'] ?? 'none',
            'external_subscription_id' => $row['external_subscription_id'] ?? null,
            'start_at'              => $row['start_at'] ?? null,
            'current_period_end'    => $row['current_period_end'] ?? null,
            'cancel_at'             => $row['cancel_at'] ?? null,
            'canceled_at'           => $row['canceled_at'] ?? null,
            'created_at'            => $row['created_at'] ?? null,
            'updated_at'            => $row['updated_at'] ?? null,
            'plan'                  => earthcal_normalize_plan([
                'plan_id'       => $row['plan_plan_id'],
                'name'          => $row['plan_name'],
                'slug'          => $row['plan_slug'],
                'description'   => $row['plan_description'],
                'price_cents'   => $row['plan_price_cents'],
                'currency'      => $row['plan_currency'],
                'billing_interval' => $row['plan_billing_interval'],
                'duration_days' => $row['plan_duration_days'],
                'is_active'     => $row['plan_is_active'],
                'created_at'    => $row['plan_created_at'],
                'updated_at'    => $row['plan_updated_at'],
            ]),
        ];
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'subscription_lookup_failed', 'detail' => $e->getMessage()]);
    exit;
}

echo json_encode([
    'ok' => true,
    'plans' => $plans,
    'current_subscription' => $currentSubscription,
    'current_plan_name' => $currentSubscription['plan']['name'] ?? null,
]);

