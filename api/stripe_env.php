<?php
/**
 * Stripe Environment + Loader
 *
 * This file should NEVER be committed to Git.
 * Keep it only on your server.
 *
 * Responsibilities:
 *  - Load Composer autoloader (ensures stripe-php available)
 *  - Load Stripe secret + webhook secret
 *  - Initialize \Stripe\Stripe
 *  - Provide access to STRIPE key vars
 */

// ----------------------------------------------------
// 1) Load Composer (Stripe PHP SDK)
// ----------------------------------------------------
$composerAutoload = __DIR__ . "/../../vendor/autoload.php";
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
} else {
    error_log("stripe_env.php: vendor/autoload.php not found");
    http_response_code(500);
    echo json_encode(['error' => 'Stripe SDK not found']);
    exit;
}

// ----------------------------------------------------
// 2) Stripe keys
//    These can alternatively be stored in real ENV vars
//    (recommended for staging/production).
// ----------------------------------------------------

$STRIPE_SECRET_KEY     = getenv('STRIPE_SECRET_KEY')     ?: 'sk_live_xxxxxx';
$STRIPE_WEBHOOK_SECRET = getenv('STRIPE_WEBHOOK_SECRET') ?: 'whsec_xxxxxx';

// OPTIONAL — public key if needed for server→client handoff
$STRIPE_PUBLIC_KEY     = getenv('STRIPE_PUBLIC_KEY')     ?: 'pk_live_xxxxxx';

if (!$STRIPE_SECRET_KEY) {
    error_log("stripe_env.php: Stripe secret key missing");
    http_response_code(500);
    echo json_encode(['error' => 'Stripe secret key missing']);
    exit;
}

// ----------------------------------------------------
// 3) Initialize Stripe
// ----------------------------------------------------

\Stripe\Stripe::setApiKey($STRIPE_SECRET_KEY);

// (Optional) Set API version explicitly
// \Stripe\Stripe::setApiVersion('2024-06-20');

// ----------------------------------------------------
// 4) Export vars safely
// ----------------------------------------------------
return [
    'STRIPE_SECRET_KEY'     => $STRIPE_SECRET_KEY,
    'STRIPE_WEBHOOK_SECRET' => $STRIPE_WEBHOOK_SECRET,
    'STRIPE_PUBLIC_KEY'     => $STRIPE_PUBLIC_KEY,
];
