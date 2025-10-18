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
if ($origin && in_array(rtrim($origin, '/'), $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . rtrim($origin, '/'));
} elseif ($origin === '' || $origin === null) {
    header('Access-Control-Allow-Origin: *');
} else {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'cors_denied']);
    exit;
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

require_once __DIR__ . '/../pdo_connect.php';

function toUtc(string $local, string $tzid): string {
    try {
        $tz = new DateTimeZone($tzid ?: 'Etc/UTC');
    } catch (Throwable $e) {
        $tz = new DateTimeZone('Etc/UTC');
    }
    $dt = new DateTime($local ?: 'now', $tz);
    $dt->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Y-m-d H:i:s');
}

try {
    $pdo = earthcal_get_pdo();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $lookup = $pdo->prepare(
        'SELECT i.calendar_id, c.user_id
         FROM items_v1_tb AS i
         INNER JOIN calendars_v1_tb AS c ON c.calendar_id = i.calendar_id
         WHERE i.item_id = :item_id
         LIMIT 1'
    );
    $lookup->execute(['item_id' => $itemId]);
    $itemRow = $lookup->fetch(PDO::FETCH_ASSOC);
    if (!$itemRow || (int)$itemRow['user_id'] !== $buwanaId) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden']);
        exit;
    }

    $fields = [];
    $params = ['item_id' => $itemId];

    if (isset($data['summary'])) {
        $fields[] = 'summary = :summary';
        $params['summary'] = trim((string)$data['summary']);
    }

    if (array_key_exists('description', $data)) {
        $fields[] = 'description = :description';
        $params['description'] = trim((string)$data['description']);
    }

    if (isset($data['tzid'])) {
        $fields[] = 'tzid = :tzid';
        $params['tzid'] = trim((string)$data['tzid']) ?: 'Etc/UTC';
    }

    if (isset($data['pinned'])) {
        $fields[] = 'pinned = :pinned';
        $params['pinned'] = !empty($data['pinned']) ? 1 : 0;
    }

    if (isset($data['emoji'])) {
        $fields[] = 'item_emoji = :emoji';
        $params['emoji'] = trim((string)$data['emoji']);
    }

    if (isset($data['color_hex'])) {
        $fields[] = 'item_color = :color_hex';
        $params['color_hex'] = trim((string)$data['color_hex']);
    }

    if (isset($data['all_day'])) {
        $fields[] = 'all_day = :all_day';
        $params['all_day'] = !empty($data['all_day']) ? 1 : 0;
    }

    if (isset($data['percent_complete'])) {
        $fields[] = 'percent_complete = :percent_complete';
        $params['percent_complete'] = max(0, min(100, (int)$data['percent_complete']));
    }

    if (isset($data['status'])) {
        $fields[] = 'status = :status';
        $params['status'] = trim((string)$data['status']);
    }

    if (isset($data['start_local'])) {
        $tzid = $params['tzid'] ?? ($data['tzid'] ?? $itemRow['tzid'] ?? 'Etc/UTC');
        $dtstartUtc = toUtc((string)$data['start_local'], (string)$tzid);
        $fields[] = 'dtstart_utc = :dtstart';
        $params['dtstart'] = $dtstartUtc;
    }

    if (!$fields) {
        echo json_encode(['ok' => true, 'item_id' => $itemId, 'updated' => []]);
        exit;
    }

    $fields[] = 'updated_at = NOW()';
    $sql = 'UPDATE items_v1_tb SET ' . implode(', ', $fields) . ' WHERE item_id = :item_id LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $fetch = $pdo->prepare('SELECT * FROM items_v1_tb WHERE item_id = :item_id LIMIT 1');
    $fetch->execute(['item_id' => $itemId]);
    $updatedItem = $fetch->fetch(PDO::FETCH_ASSOC);

    $updatedFields = array_values(array_filter(array_keys($params), static function ($key) {
        return $key !== 'item_id';
    }));

    echo json_encode([
        'ok' => true,
        'item_id' => $itemId,
        'updated' => $updatedFields,
        'item' => $updatedItem
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'update_failed',
        'detail' => $e->getMessage()
    ]);
}
