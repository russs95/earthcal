<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| get_calendar_items.php — EarthCal v1.0
|--------------------------------------------------------------------------
| PURPOSE:
|   This API retrieves a calendar and all its visible items (events, todos,
|   journals) from `items_v1_tb`.
|
| BEHAVIOR:
|   - Validates CORS (only EarthCal/GoBrik/localhost origins)
|   - Accepts JSON POST containing { "calendar_id": ### }
|   - Fetches the calendar metadata (joins user info)
|   - Checks that the calendar is PUBLIC (otherwise denies access)
|   - Returns:
|       {
|         ok: true,
|         calendar: { metadata },
|         items: [ ...items from items_v1_tb... ],
|         count: <number_of_items>
|       }
|
| NOTE:
|   This endpoint is intended for *public calendar sharing* (e.g., showing
|   calendars that others have made public).
|
|   For a user’s personal or subscribed (private) calendars, a separate
|   authenticated endpoint should be used that verifies ownership or
|   subscription permissions before returning items.
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');

/*--------------------------------------------------------
| CORS (Cross-Origin Resource Sharing)
| Only allow known origins to call this API.
---------------------------------------------------------*/
$allowedOrigins = [
    'https://ecobricks.org',
    'https://earthcal.app',
    'https://beta.earthcal.app',
    'http://localhost',
    'file://'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== null) {
    $normalizedOrigin = rtrim($origin, '/');
    if (in_array($normalizedOrigin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $normalizedOrigin);
    } else {
        // Block unexpected origins (security)
        http_response_code(403);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'cors_denied']);
        exit;
    }
} else {
    // Allow local file access or curl testing
    header('Access-Control-Allow-Origin: *');
}

/*--------------------------------------------------------
| Handle preflight OPTIONS requests (CORS handshake)
---------------------------------------------------------*/
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

/*--------------------------------------------------------
| Enforce POST method
---------------------------------------------------------*/
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'invalid_method']);
    exit;
}

/*--------------------------------------------------------
| Parse input JSON or form POST data
---------------------------------------------------------*/
$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$calendarId = filter_var($input['calendar_id'] ?? $input['cal_id'] ?? null, FILTER_VALIDATE_INT);
if (!$calendarId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'calendar_id_required']);
    exit;
}

/*--------------------------------------------------------
| Database Connection (PDO)
---------------------------------------------------------*/
try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'success' => false,
        'error' => 'db_connect_failed',
        'detail' => $e->getMessage(),
    ]);
    exit;
}

/*--------------------------------------------------------
| Fetch calendar metadata (join with user info)
---------------------------------------------------------*/
try {
    $calendarStmt = $pdo->prepare(
        'SELECT c.calendar_id, c.user_id, c.name, c.description, c.cal_emoji, c.color, c.tzid,
                c.category, c.visibility, c.is_readonly, c.created_at, c.updated_at,
                u.first_name, u.last_name, u.full_name
           FROM calendars_v1_tb AS c
      LEFT JOIN users_tb AS u ON u.buwana_id = c.user_id
          WHERE c.calendar_id = ?
          LIMIT 1'
    );
    $calendarStmt->execute([$calendarId]);
    $calendarRow = $calendarStmt->fetch(PDO::FETCH_ASSOC);

    if (!$calendarRow) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'calendar_not_found']);
        exit;
    }

    /*----------------------------------------------------
    | Only allow PUBLIC calendars to be fetched here.
    | For private calendars, this prevents leaking data.
    -----------------------------------------------------*/
    if (($calendarRow['visibility'] ?? '') !== 'public') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'calendar_not_public']);
        exit;
    }

    /*----------------------------------------------------
    | Fetch all non-deleted items for this calendar.
    | Items come from items_v1_tb (VEVENT/VTODO/VJOURNAL).
    -----------------------------------------------------*/
    $itemsStmt = $pdo->prepare(
        'SELECT item_id, calendar_id, uid, component_type, summary, description, location, url, tzid,
                dtstart_utc, dtend_utc, due_utc, all_day, pinned, item_emoji, item_color,
                percent_complete, priority, status, completed_at, classification,
                created_at, updated_at
           FROM items_v1_tb
          WHERE calendar_id = :cid
            AND deleted_at IS NULL
       ORDER BY (dtstart_utc IS NULL) ASC, dtstart_utc ASC, item_id ASC'
    );
    $itemsStmt->execute(['cid' => $calendarId]);

    $items = [];
    while ($row = $itemsStmt->fetch(PDO::FETCH_ASSOC)) {
        $items[] = [
            'item_id' => (int)$row['item_id'],
            'calendar_id' => (int)$row['calendar_id'],
            'uid' => $row['uid'],
            'component_type' => $row['component_type'],
            'summary' => $row['summary'],
            'description' => $row['description'],
            'location' => $row['location'],
            'url' => $row['url'],
            'tzid' => $row['tzid'],
            'dtstart_utc' => $row['dtstart_utc'],
            'dtend_utc' => $row['dtend_utc'],
            'due_utc' => $row['due_utc'],
            'all_day' => isset($row['all_day']) ? (int)$row['all_day'] : null,
            'pinned' => isset($row['pinned']) ? (int)$row['pinned'] : null,
            'item_emoji' => $row['item_emoji'],
            'item_color' => $row['item_color'],
            'percent_complete' => $row['percent_complete'] !== null ? (float)$row['percent_complete'] : null,
            'priority' => $row['priority'] !== null ? (int)$row['priority'] : null,
            'status' => $row['status'],
            'completed_at' => $row['completed_at'],
            'classification' => $row['classification'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }

    /*----------------------------------------------------
    | Construct and return JSON response
    -----------------------------------------------------*/
    $calendar = [
        'calendar_id' => (int)$calendarRow['calendar_id'],
        'name' => $calendarRow['name'],
        'description' => $calendarRow['description'],
        'emoji' => $calendarRow['cal_emoji'],
        'color' => $calendarRow['color'],
        'tzid' => $calendarRow['tzid'],
        'category' => $calendarRow['category'],
        'visibility' => $calendarRow['visibility'],
        'is_readonly' => isset($calendarRow['is_readonly']) ? (bool)$calendarRow['is_readonly'] : true,
        'created_at' => $calendarRow['created_at'],
        'updated_at' => $calendarRow['updated_at'],
        'owner' => [
            'buwana_id' => $calendarRow['user_id'] !== null ? (int)$calendarRow['user_id'] : null,
            'first_name' => $calendarRow['first_name'] ?? null,
            'last_name' => $calendarRow['last_name'] ?? null,
            'full_name' => $calendarRow['full_name'] ?? null,
        ],
    ];

    echo json_encode([
        'ok' => true,
        'success' => true,
        'calendar_id' => (int)$calendarRow['calendar_id'],
        'calendar' => $calendar,
        'items' => $items,
        'count' => count($items),
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'success' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage(),
    ]);
}
?>
