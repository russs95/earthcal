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
if (in_array(rtrim($origin, '/'), $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . rtrim($origin, '/'));
} elseif ($origin === '' || $origin === null) {
    header('Access-Control-Allow-Origin: *');
} else {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'cors_denied']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'invalid_method']);
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
    $sql = <<<'SQL'
SELECT c.calendar_id,
       c.user_id,
       c.name,
       c.description,
       c.category,
       c.visibility,
       c.created_at,
       c.updated_at,
       c.cal_emoji,
       c.color,
       u.first_name,
       u.last_name,
       u.full_name,
       COUNT(i.item_id) AS item_count
  FROM calendars_v1_tb c
  LEFT JOIN users_tb u
    ON u.buwana_id = c.user_id
  LEFT JOIN items_v1_tb i
    ON i.calendar_id = c.calendar_id
   AND i.deleted_at IS NULL
 WHERE c.visibility = 'public'
 GROUP BY c.calendar_id,
          c.user_id,
          c.name,
          c.description,
          c.category,
          c.visibility,
          c.created_at,
          c.updated_at,
          c.cal_emoji,
          c.color,
          u.first_name,
          u.last_name,
          u.full_name
 ORDER BY c.updated_at DESC,
          c.calendar_id DESC
SQL;

    $stmt = $pdo->query($sql);

    $publicCalendars = [];
    foreach ($stmt as $row) {
        $publicCalendars[] = [
            'calendar_id' => (int)$row['calendar_id'],
            'name'        => $row['name'],
            'description' => $row['description'],
            'category'    => $row['category'],
            'visibility'  => $row['visibility'],
            'created_at'  => $row['created_at'],
            'updated_at'  => $row['updated_at'],
            'emoji'       => $row['cal_emoji'],
            'color'       => $row['color'],
            'item_count'  => (int)$row['item_count'],
            'owner'       => [
                'buwana_id'  => (int)$row['user_id'],
                'first_name' => $row['first_name'],
                'last_name'  => $row['last_name'],
                'full_name'  => $row['full_name'],
            ],
        ];
    }

    echo json_encode(['ok' => true, 'calendars' => $publicCalendars], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage(),
    ]);
}
