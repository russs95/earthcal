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

// LIVE KEYS
// $STRIPE_SECRET_KEY     = getenv('STRIPE_SECRET_KEY')     ?: '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';
// $STRIPE_WEBHOOK_SECRET = getenv('STRIPE_WEBHOOK_SECRET') ?: 'whsec_PUt3EwMXzqrJxW7qVO5BT0Ormwxojw5W';
// $STRIPE_PUBLIC_KEY     = getenv('STRIPE_PUBLIC_KEY')     ?: 'pk_live_51JlVgkAf11vVEZWPFnrayNSHFit7kFcHCYPSFtmYfRS5XNx1UPTjrmKv58uyvuF6jAiriCKMRqm9VmzxRoMHTTEF00S8yRI8Eh';

//TEST KEYS
$STRIPE_SECRET_KEY     = getenv('STRIPE_SECRET_KEY')     ?: 'sk_test_51SR3NGPEdw1leNTahdQR42k7NB74lN8lkk7W4xHZ5cPWPmQcUPRMmknh8TfmeEW7yAa7eKobM9BCxkS5CYjYnd1a00ktUoAtJS';
$STRIPE_WEBHOOK_SECRET = getenv('STRIPE_WEBHOOK_SECRET') ?: 'whsec_B8aEyIE5EmR7JNjpzy79YOLR0bIQvSe2';
$STRIPE_PUBLIC_KEY     = getenv('STRIPE_PUBLIC_KEY')     ?: 'pk_test_51SR3NGPEdw1leNTalg4CIE5UQVy0dl7BpJX8jHSh9aL3EOpN2UfznZHbCti40b76XupEvDObpdlzyCasegTN45ip00uytBKGs6';

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
