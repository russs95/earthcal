<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

/* ============================================================
   EARTHCAL v1 APIS  | delete_item.php
   Soft-deletes an existing To-Do / Event / Journal entry.
   ------------------------------------------------------------
   Expected JSON Payload:
   {
     "buwana_id": 123,
     "item_id": 456
   }
   ------------------------------------------------------------
   Successful Response:
   {
     "ok": true,
     "item_id": 456
   }
   ============================================================ */


// -------------------------------------------------------------
// 0. Earthcal.app server-based APIs CORS Setup
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
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        exit(0);
    }
} else {
    // No Origin header (e.g. curl, server-side) – no CORS needed
    // You can leave this branch empty or add minimal headers if you like.
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'invalid_method']);
    exit;
}

// -------------------------------------------------------------
// 1. Parse & validate input
// -------------------------------------------------------------
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '[]', true);
if (!is_array($data)) {
    $data = $_POST;
}

$buwanaId = filter_var($data['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$itemId    = filter_var($data['item_id'] ?? null, FILTER_VALIDATE_INT);
if (!$buwanaId || !$itemId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_required_fields']);
    exit;
}

// -------------------------------------------------------------
// 2. Database connection (via PDO)
// -------------------------------------------------------------
require_once __DIR__ . '/../pdo_connect.php';

try {
    $pdo = earthcal_get_pdo();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $lookup = $pdo->prepare(
        'SELECT c.user_id
         FROM items_v1_tb AS i
         INNER JOIN calendars_v1_tb AS c ON c.calendar_id = i.calendar_id
         WHERE i.item_id = :item_id
         LIMIT 1'
    );
    $lookup->execute(['item_id' => $itemId]);
    $row = $lookup->fetch(PDO::FETCH_ASSOC);
    if (!$row || (int)$row['user_id'] !== $buwanaId) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden']);
        exit;
    }

    $delete = $pdo->prepare('UPDATE items_v1_tb SET deleted_at = NOW(), updated_at = NOW() WHERE item_id = :item_id LIMIT 1');
    $delete->execute(['item_id' => $itemId]);

    echo json_encode(['ok' => true, 'item_id' => $itemId]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'delete_failed',
        'detail' => $e->getMessage()
    ]);
}
