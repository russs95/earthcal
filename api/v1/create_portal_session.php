<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

//
// CORS
//
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
        echo json_encode(['ok'=>false,'error'=>'cors_denied']);
        exit;
    }
} else {
    header('Access-Control-Allow-Origin: *');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'error'=>'invalid_method']);
    exit;
}


// =========================================================
// Load Stripe & DB
// =========================================================

$env = require __DIR__ . "/../stripe_env.php";

require_once __DIR__ . '/../pdo_connect.php';

try {
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'db_connect_failed']);
    exit;
}


// =========================================================
// Parse input
// =========================================================

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '{}', true);

$buwana_id = isset($input['buwana_id'])
    ? (int)$input['buwana_id']
    : null;

if (!$buwana_id) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'buwana_id_required']);
    exit;
}


// =========================================================
// Lookup user and stripe_customer_id
// =========================================================

$st = $pdo->prepare("
    SELECT buwana_id, stripe_customer_id
    FROM users_tb
    WHERE buwana_id = ?
    LIMIT 1
");
$st->execute([$buwana_id]);
$user = $st->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'user_not_found']);
    exit;
}

$stripe_customer_id = $user['stripe_customer_id'] ?? null;

if (!$stripe_customer_id) {
    //
    // The user has no stripe_customer_id yet.
    // Either:
    //  - They never purchased
    //  - Or their Stripe Customer record wasn't created
    //
    // To remain graceful, we create a new customer.
    //

    try {
        $customer = \Stripe\Customer::create([
            'metadata' => [
                'buwana_id' => $buwana_id
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

    } catch (Throwable $e) {
        error_log("create_portal_session.php: Failed to create Stripe customer — " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['ok'=>false,'error'=>'stripe_customer_error']);
        exit;
    }
}


// =========================================================
// Create Billing Portal Session
// =========================================================

try {

    // User returns here after finishing in Portal
    $returnUrl = 'https://earthcal.app/dash.html?status=upgrade_success';

    $portalSession = \Stripe\BillingPortal\Session::create([
        'customer'   => $stripe_customer_id,
        'return_url' => $returnUrl
    ]);

    echo json_encode([
        'ok'  => true,
        'url' => $portalSession->url
    ]);
    exit;

} catch (Throwable $e) {
    error_log("create_portal_session.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'stripe_portal_error',
        'detail'=> $e->getMessage()
    ]);
    exit;
}
