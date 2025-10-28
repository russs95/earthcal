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

try {
    $planStmt = $pdo->prepare(
        'SELECT plan_id, name, slug, description, price_cents, currency, billing_interval, duration_days, is_active, created_at, updated_at
           FROM plans_tb
       ORDER BY CASE WHEN price_cents = 0 THEN 0 ELSE 1 END, price_cents ASC, plan_id ASC'
    );
    $planStmt->execute();

    $plans = [];
    while ($row = $planStmt->fetch(PDO::FETCH_ASSOC)) {
        $plans[] = [
            'plan_id'          => (int)$row['plan_id'],
            'name'             => (string)$row['name'],
            'slug'             => (string)$row['slug'],
            'description'      => $row['description'],
            'price_cents'      => (int)$row['price_cents'],
            'currency'         => $row['currency'] !== null ? (string)$row['currency'] : 'USD',
            'billing_interval' => $row['billing_interval'] !== null ? (string)$row['billing_interval'] : 'month',
            'duration_days'    => $row['duration_days'] !== null ? (int)$row['duration_days'] : null,
            'is_active'        => (bool)((int)$row['is_active'] ?? 0),
            'created_at'       => $row['created_at'],
            'updated_at'       => $row['updated_at'],
        ];
    }

    $subStmt = $pdo->prepare(
        "SELECT us.*, p.name AS plan_name, p.slug AS plan_slug, p.description AS plan_description,
                p.price_cents, p.currency, p.billing_interval, p.duration_days
           FROM user_subscriptions_tb AS us
           JOIN plans_tb AS p ON p.plan_id = us.plan_id
          WHERE us.user_id = :uid
       ORDER BY CASE us.status
                    WHEN 'active' THEN 1
                    WHEN 'trial' THEN 2
                    WHEN 'past_due' THEN 3
                    WHEN 'canceled' THEN 4
                    WHEN 'expired' THEN 5
                    ELSE 6
                END,
                COALESCE(us.current_period_end, us.start_at) DESC,
                us.subscription_id DESC
          LIMIT 1"
    );
    $subStmt->execute([':uid' => $buwanaId]);
    $subscriptionRow = $subStmt->fetch(PDO::FETCH_ASSOC) ?: null;

    $currentSubscription = null;
    if ($subscriptionRow) {
        $currentSubscription = [
            'subscription_id'        => (int)$subscriptionRow['subscription_id'],
            'user_id'                => (int)$subscriptionRow['user_id'],
            'plan_id'                => (int)$subscriptionRow['plan_id'],
            'plan_name'              => (string)$subscriptionRow['plan_name'],
            'plan_slug'              => (string)$subscriptionRow['plan_slug'],
            'status'                 => (string)$subscriptionRow['status'],
            'is_gift'                => (bool)((int)$subscriptionRow['is_gift'] ?? 0),
            'coupon_code'            => $subscriptionRow['coupon_code'] !== null ? (string)$subscriptionRow['coupon_code'] : null,
            'external_provider'      => (string)$subscriptionRow['external_provider'],
            'external_subscription_id' => $subscriptionRow['external_subscription_id'] !== null ? (string)$subscriptionRow['external_subscription_id'] : null,
            'start_at'               => $subscriptionRow['start_at'],
            'current_period_end'     => $subscriptionRow['current_period_end'],
            'cancel_at'              => $subscriptionRow['cancel_at'],
            'canceled_at'            => $subscriptionRow['canceled_at'],
            'created_at'             => $subscriptionRow['created_at'],
            'updated_at'             => $subscriptionRow['updated_at'],
            'price_cents'            => (int)$subscriptionRow['price_cents'],
            'currency'               => $subscriptionRow['currency'] !== null ? (string)$subscriptionRow['currency'] : 'USD',
            'billing_interval'       => $subscriptionRow['billing_interval'] !== null ? (string)$subscriptionRow['billing_interval'] : 'month',
            'duration_days'          => $subscriptionRow['duration_days'] !== null ? (int)$subscriptionRow['duration_days'] : null,
            'plan_description'       => $subscriptionRow['plan_description'],
        ];
    }

    echo json_encode([
        'ok' => true,
        'plans' => $plans,
        'current_subscription' => $currentSubscription,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'query_failed',
        'detail' => $e->getMessage(),
    ]);
}
