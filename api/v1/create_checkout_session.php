<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Allow your trusted origins
$allowedOrigins = [
    'https://earthcal.app',
    'https://beta.earthcal.app',
    'http://localhost',
    'file://'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== null) {
    $normalized = rtrim($origin, '/');
    if (in_array($normalized, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $normalized);
    } else {
        http_response_code(403);
        echo json_encode(['ok'=>false, 'error'=>'cors_denied']);
        exit;
    }
} else {
    header('Access-Control-Allow-Origin: *');
}

// Preflight
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false, 'error'=>'invalid_method']);
    exit;
}

// ====================================
// Load env + DB
// ====================================
$env = require __DIR__ . "/../stripe_env.php";
$STRIPE_PUBLIC_KEY = $env['STRIPE_PUBLIC_KEY'] ?? null;

require_once __DIR__ . '/../pdo_connect.php';

try {
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false, 'error'=>'db_connect_failed']);
    exit;
}


// ====================================
// Read request
// ====================================
$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '{}', true);

$buwana_id = isset($input['buwana_id'])
    ? (int)$input['buwana_id']
    : null;

$interval = isset($input['interval'])
    ? strtolower(trim((string)$input['interval']))
    : 'month';

if (!$buwana_id) {
    http_response_code(400);
    echo json_encode(['ok'=>false, 'error'=>'buwana_id_required']);
    exit;
}

// Validate interval
$allowed_intervals = ['month','year','lifetime'];
if (!in_array($interval, $allowed_intervals, true)) {
    http_response_code(400);
    echo json_encode(['ok'=>false, 'error'=>'invalid_interval']);
    exit;
}


// ====================================
// Resolve user + stripe_customer_id
// ====================================
$userStmt = $pdo->prepare("
    SELECT buwana_id, stripe_customer_id
    FROM users_tb
    WHERE buwana_id = ?
    LIMIT 1
");
$userStmt->execute([$buwana_id]);
$user = $userStmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode(['ok'=>false, 'error'=>'user_not_found']);
    exit;
}

$stripe_customer_id = $user['stripe_customer_id'] ?? null;


// ====================================
// Map interval → Stripe price lookup_key
// ====================================
$lookup_map = [
    'month'    => 'jedi_monthly',
    'year'     => 'jedi_yearly',
    'lifetime' => 'jedi_lifetime',
];

$lookup_key = $lookup_map[$interval] ?? null;


// ====================================
// Load Stripe
// ====================================
use \Stripe\Price;
use \Stripe\Customer;
use \Stripe\Checkout\Session;

try {

    // 1) Get Stripe Price from lookup_key
    $prices = Price::all([
        'lookup_keys' => [$lookup_key],
        'expand'      => ['data.product']
    ]);

    if (!isset($prices->data[0])) {
        http_response_code(500);
        echo json_encode(['ok'=>false, 'error'=>'price_not_found']);
        exit;
    }

    $price = $prices->data[0];

    // 2) Ensure Stripe Customer exists
    if (!$stripe_customer_id) {

        $customer = Customer::create([
            'metadata' => [
                'buwana_id' => $buwana_id,
            ],
        ]);

        $stripe_customer_id = $customer->id;

        // Save to DB
        $up = $pdo->prepare("
            UPDATE users_tb
            SET stripe_customer_id = :cid
            WHERE buwana_id = :bid
        ");
        $up->execute([
            'cid' => $stripe_customer_id,
            'bid' => $buwana_id,
        ]);
    }

    // 3) Create Checkout Session
    $mode = ($interval === 'lifetime') ? 'payment' : 'subscription';

    $session = Session::create([
        'mode'       => $mode,
        'customer'   => $stripe_customer_id,
        'line_items' => [[
            'price'    => $price->id,
            'quantity' => 1,
        ]],
        'allow_promotion_codes' => true,
        'metadata' => [
            'buwana_id' => $buwana_id,
        ],
        'success_url' => 'https://earthcal.app/billing-success.html?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url'  => 'https://earthcal.app/billing-cancel',
    ]);


    echo json_encode([
        'ok'  => true,
        'url' => $session->url
    ]);
    exit;

} catch (Throwable $e) {
    error_log("create_checkout_session error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok'=>false, 'error'=>'stripe_error','detail'=>$e->getMessage()]);
    exit;
}
