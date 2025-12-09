<?php

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

/* ============================================================
   EARTHCAL v1 APIS  | get_earthcal_plans.php
   Returns the list of active subscription plans for the app.
   ============================================================ */

// -------------------------------------------------------------
//  0. Earthcal.app server-based APIs CORS Setup
// -------------------------------------------------------------

$allowed_origins = [
    'https://earthcal.app',
    'https://beta.earthcal.app',
    // EarthCal desktop / local dev:
    'http://127.0.0.1:3000',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// If this is a CORS request (Origin header present)…
if ($origin !== '') {
    $normalized_origin = rtrim($origin, '/');

    if (in_array($normalized_origin, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $normalized_origin);
        header('Vary: Origin'); // best practice
    } else {
        // Explicitly reject unknown web origins
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'cors_denied']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        exit(0);
    }
} else {
    // No Origin header (e.g. curl, server-side) – no CORS needed
    // You can leave this branch empty or add minimal headers if you like.
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'invalid_method']);
    exit;
}


// -------------------------------------------------------------
// 1. Connect to database (PDO)
// -------------------------------------------------------------
try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect_failed', 'detail' => $e->getMessage()]);
    exit;
}


// -------------------------------------------------------------
// 2. Load helpers
// -------------------------------------------------------------
require_once __DIR__ . '/../earthcal_plan_helpers.php';


// -------------------------------------------------------------
// 3. Fetch active plans
// -------------------------------------------------------------
try {
    $plans = earthcal_fetch_active_plans($pdo);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'plan_lookup_failed', 'detail' => $e->getMessage()]);
    exit;
}


// -------------------------------------------------------------
// 4. Response
// -------------------------------------------------------------
echo json_encode([
    'ok' => true,
    'plans' => $plans,
    'count' => count($plans),
]);
