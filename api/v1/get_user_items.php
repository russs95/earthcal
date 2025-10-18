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
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$buwanaId = filter_var($input['buwana_id'] ?? null, FILTER_VALIDATE_INT);
if (!$buwanaId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'buwana_id_required']);
    exit;
}

require_once __DIR__ . '/../pdo_connect.php';

try {
    $pdo = earthcal_get_pdo();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $calendars = [];

    $personalStmt = $pdo->prepare(
        'SELECT calendar_id, user_id, name, description, cal_emoji, color, tzid, category, visibility,
                default_my_calendar, is_readonly, created_at, updated_at
         FROM calendars_v1_tb
         WHERE user_id = :uid'
    );
    $personalStmt->execute(['uid' => $buwanaId]);
    foreach ($personalStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $calId = (int)$row['calendar_id'];
        $calendars[$calId] = [
            'calendar_id'         => $calId,
            'name'                => $row['name'] ?? 'My Calendar',
            'description'         => $row['description'] ?? null,
            'emoji'               => $row['cal_emoji'] ?? '📅',
            'color'               => $row['color'] ?? '#3b82f6',
            'tzid'                => $row['tzid'] ?? 'Etc/UTC',
            'category'            => $row['category'] ?? 'personal',
            'visibility'          => $row['visibility'] ?? 'private',
            'default_my_calendar' => isset($row['default_my_calendar']) ? ((int)$row['default_my_calendar'] === 1) : false,
            'is_readonly'         => isset($row['is_readonly']) ? (bool)$row['is_readonly'] : false,
            'source_type'         => 'personal',
            'display_enabled'     => true,
            'is_active'           => true,
            'created_at'          => $row['created_at'] ?? null,
            'updated_at'          => $row['updated_at'] ?? null,
            'items'               => [],
        ];
    }

    $subscriptionStmt = $pdo->prepare(
        'SELECT s.subscription_id, s.calendar_id, s.earthcal_calendar_id, s.source_type,
                s.display_enabled, s.is_active, s.color AS subscription_color, s.emoji AS subscription_emoji,
                c.calendar_id AS linked_calendar_id, c.user_id AS owner_user_id,
                c.name, c.description, c.cal_emoji, c.color, c.tzid, c.category, c.visibility, c.is_readonly,
                c.created_at, c.updated_at
         FROM subscriptions_v1_tb AS s
         LEFT JOIN calendars_v1_tb AS c
           ON c.calendar_id = COALESCE(s.calendar_id, s.earthcal_calendar_id)
         WHERE s.user_id = :uid'
    );
    $subscriptionStmt->execute(['uid' => $buwanaId]);
    foreach ($subscriptionStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $calId = $row['calendar_id'] ?? $row['earthcal_calendar_id'] ?? $row['linked_calendar_id'];
        if (!$calId) {
            continue;
        }
        $calId = (int)$calId;

        if (!isset($calendars[$calId])) {
            $calendars[$calId] = [
                'calendar_id'         => $calId,
                'name'                => $row['name'] ?? 'Subscribed Calendar',
                'description'         => $row['description'] ?? null,
                'emoji'               => $row['subscription_emoji'] ?? $row['cal_emoji'] ?? '📅',
                'color'               => $row['subscription_color'] ?? $row['color'] ?? '#3b82f6',
                'tzid'                => $row['tzid'] ?? 'Etc/UTC',
                'category'            => $row['category'] ?? 'personal',
                'visibility'          => $row['visibility'] ?? 'public',
                'default_my_calendar' => false,
                'is_readonly'         => ($row['source_type'] ?? '') !== 'personal',
                'source_type'         => $row['source_type'] ?? 'subscription',
                'display_enabled'     => isset($row['display_enabled']) ? (bool)$row['display_enabled'] : true,
                'is_active'           => isset($row['is_active']) ? (bool)$row['is_active'] : true,
                'created_at'          => $row['created_at'] ?? null,
                'updated_at'          => $row['updated_at'] ?? null,
                'owner_user_id'       => isset($row['owner_user_id']) ? (int)$row['owner_user_id'] : null,
                'items'               => [],
            ];
        }

        if (isset($row['subscription_emoji']) && $row['subscription_emoji'] !== '') {
            $calendars[$calId]['emoji'] = $row['subscription_emoji'];
        }
        if (isset($row['subscription_color']) && $row['subscription_color'] !== '') {
            $calendars[$calId]['color'] = $row['subscription_color'];
        }

        $calendars[$calId]['subscription_id'] = isset($row['subscription_id']) ? (int)$row['subscription_id'] : null;
        if (isset($row['display_enabled'])) {
            $calendars[$calId]['display_enabled'] = (bool)$row['display_enabled'];
        }
        if (isset($row['is_active'])) {
            $calendars[$calId]['is_active'] = (bool)$row['is_active'];
        }
        if (isset($row['owner_user_id'])) {
            $calendars[$calId]['owner_user_id'] = (int)$row['owner_user_id'];
        }
    }

    $aclStmt = $pdo->prepare(
        'SELECT a.calendar_id, a.role, a.status,
                c.name, c.description, c.cal_emoji, c.color, c.tzid, c.category, c.visibility, c.is_readonly,
                c.created_at, c.updated_at
         FROM calendar_acl_v1_tb AS a
         INNER JOIN calendars_v1_tb AS c ON c.calendar_id = a.calendar_id
         WHERE a.grantee_user_id = :uid AND a.status = "accepted"'
    );
    $aclStmt->execute(['uid' => $buwanaId]);
    foreach ($aclStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $calId = (int)$row['calendar_id'];
        if (!isset($calendars[$calId])) {
            $calendars[$calId] = [
                'calendar_id'         => $calId,
                'name'                => $row['name'] ?? 'Shared Calendar',
                'description'         => $row['description'] ?? null,
                'emoji'               => $row['cal_emoji'] ?? '📅',
                'color'               => $row['color'] ?? '#3b82f6',
                'tzid'                => $row['tzid'] ?? 'Etc/UTC',
                'category'            => $row['category'] ?? 'personal',
                'visibility'          => $row['visibility'] ?? 'private',
                'default_my_calendar' => false,
                'is_readonly'         => isset($row['is_readonly']) ? (bool)$row['is_readonly'] : true,
                'source_type'         => 'shared',
                'display_enabled'     => true,
                'is_active'           => true,
                'created_at'          => $row['created_at'] ?? null,
                'updated_at'          => $row['updated_at'] ?? null,
                'shared_role'         => $row['role'] ?? 'viewer',
                'items'               => [],
            ];
        } else {
            $calendars[$calId]['source_type'] = $calendars[$calId]['source_type'] ?? 'shared';
            $calendars[$calId]['shared_role'] = $row['role'] ?? 'viewer';
        }
    }

    $itemCalendarIds = [];
    foreach ($calendars as $calendarId => $calendar) {
        $isActive = $calendar['is_active'] ?? true;
        $isVisible = $calendar['display_enabled'] ?? true;
        if ($isActive && $isVisible) {
            $itemCalendarIds[] = (int)$calendarId;
        }
    }

    if ($itemCalendarIds) {
        $placeholders = implode(',', array_fill(0, count($itemCalendarIds), '?'));
        $itemStmt = $pdo->prepare(
            'SELECT item_id, calendar_id, uid, component_type, summary, description, location, url, organizer, tzid,
                    dtstart_utc, dtend_utc, all_day, pinned, item_emoji, item_color, due_utc, percent_complete,
                    priority, status, completed_at, classification, categories_json, latitude, longitude, extras,
                    created_at, updated_at
             FROM items_v1_tb
             WHERE calendar_id IN (' . $placeholders . ') AND deleted_at IS NULL'
        );
        $itemStmt->execute($itemCalendarIds);

        while ($item = $itemStmt->fetch(PDO::FETCH_ASSOC)) {
            $calId = (int)($item['calendar_id'] ?? 0);
            if (!isset($calendars[$calId])) {
                continue;
            }

            $calendars[$calId]['items'][] = [
                'item_id'          => (int)$item['item_id'],
                'calendar_id'      => $calId,
                'uid'              => $item['uid'] ?? null,
                'component_type'   => $item['component_type'] ?? null,
                'summary'          => $item['summary'] ?? null,
                'description'      => $item['description'] ?? null,
                'location'         => $item['location'] ?? null,
                'url'              => $item['url'] ?? null,
                'organizer'        => $item['organizer'] ?? null,
                'tzid'             => $item['tzid'] ?? null,
                'dtstart_utc'      => $item['dtstart_utc'] ?? null,
                'dtend_utc'        => $item['dtend_utc'] ?? null,
                'all_day'          => isset($item['all_day']) ? (int)$item['all_day'] : 0,
                'pinned'           => isset($item['pinned']) ? (int)$item['pinned'] : 0,
                'item_emoji'       => $item['item_emoji'] ?? null,
                'item_color'       => $item['item_color'] ?? null,
                'due_utc'          => $item['due_utc'] ?? null,
                'percent_complete' => isset($item['percent_complete']) && $item['percent_complete'] !== null
                    ? (int)$item['percent_complete']
                    : null,
                'priority'         => isset($item['priority']) && $item['priority'] !== null
                    ? (int)$item['priority']
                    : null,
                'status'           => $item['status'] ?? null,
                'completed_at'     => $item['completed_at'] ?? null,
                'classification'   => $item['classification'] ?? null,
                'categories_json'  => $item['categories_json'] ?? null,
                'latitude'         => isset($item['latitude']) && $item['latitude'] !== null
                    ? (float)$item['latitude']
                    : null,
                'longitude'        => isset($item['longitude']) && $item['longitude'] !== null
                    ? (float)$item['longitude']
                    : null,
                'extras'           => $item['extras'] ?? null,
                'created_at'       => $item['created_at'] ?? null,
                'updated_at'       => $item['updated_at'] ?? null,
            ];
        }
    }

    $calendarList = array_values($calendars);
    $itemCount = 0;
    foreach ($calendarList as $calendar) {
        $itemCount += isset($calendar['items']) && is_array($calendar['items']) ? count($calendar['items']) : 0;
    }

    echo json_encode([
        'ok'             => true,
        'calendar_count' => count($calendarList),
        'item_count'     => $itemCount,
        'calendars'      => $calendarList,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage(),
    ]);
}
