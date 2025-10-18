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
if ($origin !== '' && $origin !== null) {
    $trimmedOrigin = rtrim($origin, '/');
    if (in_array($trimmedOrigin, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $trimmedOrigin);
    } else {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'cors_denied']);
        exit;
    }
} else {
    header('Access-Control-Allow-Origin: *');
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
$payload = json_decode($raw ?: '[]', true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$buwanaId = filter_var($payload['buwana_id'] ?? null, FILTER_VALIDATE_INT);
if (!$buwanaId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'buwana_id_required']);
    exit;
}

$includePublicRaw = $payload['include_public'] ?? true;
$boolFilter = static function ($value, bool $default = true): bool {
    if ($value === null) {
        return $default;
    }
    if (is_bool($value)) {
        return $value;
    }
    if ($value === 1 || $value === '1' || $value === 'true' || $value === 'TRUE' || $value === 'on') {
        return true;
    }
    if ($value === 0 || $value === '0' || $value === 'false' || $value === 'FALSE' || $value === 'off') {
        return false;
    }
    return $default;
};

$includePublic = $boolFilter($includePublicRaw, true);
$onlyActive   = $boolFilter($payload['only_active'] ?? true, true);
$yearFilter   = isset($payload['year']) ? (int)$payload['year'] : null;

$log = static function (string $message, array $context = []) use ($buwanaId): void {
    $prefix = '[get_user_items buwana_id=' . $buwanaId . '] ';
    if (!empty($context)) {
        $message .= ' ' . json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    error_log($prefix . $message);
};

try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect_failed', 'detail' => $e->getMessage()]);
    exit;
}

$calendars = [];

$ensureCalendar = static function (array $row, string $sourceType, array $overrides = []) use (&$calendars, $boolFilter, $buwanaId): void {
    $calendarId = isset($row['calendar_id']) ? (int)$row['calendar_id'] : null;
    if (!$calendarId) {
        return;
    }

    $isOwner = isset($row['user_id']) && (int)$row['user_id'] === $buwanaId;
    $colorOverride = $overrides['color'] ?? $row['sub_color'] ?? $row['color'] ?? '#3b82f6';
    $emojiOverride = $overrides['emoji'] ?? $row['sub_emoji'] ?? $row['cal_emoji'] ?? '📅';
    $subId         = $overrides['subscription_id'] ?? ($row['subscription_id'] ?? null);
    $activeRaw     = $overrides['is_active'] ?? ($row['sub_is_active'] ?? $row['is_active'] ?? null);
    $displayRaw    = $overrides['display_enabled'] ?? ($row['sub_display_enabled'] ?? $row['display_enabled'] ?? null);

    if (!isset($calendars[$calendarId])) {
        $calendars[$calendarId] = [
            'calendar_id'     => $calendarId,
            'name'            => $row['name'] ?? '(Unnamed Calendar)',
            'description'     => $row['description'] ?? null,
            'color'           => $colorOverride,
            'emoji'           => $emojiOverride,
            'tzid'            => $row['tzid'] ?? 'Etc/UTC',
            'visibility'      => $row['visibility'] ?? 'private',
            'category'        => $row['category'] ?? 'personal',
            'owner_buwana_id' => isset($row['user_id']) ? (int)$row['user_id'] : null,
            'is_owner'        => $isOwner,
            'is_default'      => isset($row['default_my_calendar']) ? ((int)$row['default_my_calendar'] === 1) : false,
            'is_readonly'     => isset($row['is_readonly']) ? $boolFilter($row['is_readonly'], false) : false,
            'source_type'     => $sourceType,
            'subscription_id' => $subId ? (int)$subId : null,
            'is_active'       => $boolFilter($activeRaw, true),
            'display_enabled' => $boolFilter($displayRaw, true),
            'items'           => [],
        ];
    } else {
        $cal = &$calendars[$calendarId];
        if (!empty($colorOverride)) {
            $cal['color'] = $colorOverride;
        }
        if (!empty($emojiOverride)) {
            $cal['emoji'] = $emojiOverride;
        }
        if ($subId) {
            $cal['subscription_id'] = (int)$subId;
        }
        if (isset($activeRaw)) {
            $cal['is_active'] = $boolFilter($activeRaw, $cal['is_active']);
        }
        if (isset($displayRaw)) {
            $cal['display_enabled'] = $boolFilter($displayRaw, $cal['display_enabled']);
        }
        if ($sourceType !== 'public' && $cal['source_type'] === 'public') {
            $cal['source_type'] = $sourceType;
        }
    }
};

try {
    // Personal calendars owned by the user
    $log('Executing personal calendar lookup', ['params' => ['uid_join' => $buwanaId, 'uid_filter' => $buwanaId]]);
    $personalStmt = $pdo->prepare(
        "SELECT c.*, s.subscription_id, s.is_active AS sub_is_active, s.display_enabled AS sub_display_enabled,
                s.source_type, s.color AS sub_color, s.emoji AS sub_emoji
           FROM calendars_v1_tb AS c
      LEFT JOIN subscriptions_v1_tb AS s
             ON s.user_id = :uid_join
            AND s.source_type = 'personal'
            AND s.calendar_id = c.calendar_id
          WHERE c.user_id = :uid_filter"
    );
    $personalStmt->execute([
        'uid_join' => $buwanaId,
        'uid_filter' => $buwanaId,
    ]);
    foreach ($personalStmt as $row) {
        $ensureCalendar($row, 'personal');
    }

    // Calendars the user subscribes to from the Earthcal directory
    $log('Executing Earthcal subscription lookup', ['params' => ['uid' => $buwanaId]]);
    $earthcalStmt = $pdo->prepare(
        "SELECT s.subscription_id, s.is_active AS sub_is_active, s.display_enabled AS sub_display_enabled,
                s.color AS sub_color, s.emoji AS sub_emoji, s.earthcal_calendar_id AS calendar_id,
                c.user_id, c.name, c.description, c.cal_emoji, c.color, c.tzid, c.category, c.visibility, c.is_readonly
           FROM subscriptions_v1_tb AS s
           JOIN calendars_v1_tb AS c
             ON c.calendar_id = s.earthcal_calendar_id
          WHERE s.user_id = :uid
            AND s.source_type = 'earthcal'"
    );
    $earthcalStmt->execute(['uid' => $buwanaId]);
    foreach ($earthcalStmt as $row) {
        $ensureCalendar($row, 'earthcal');
    }

    if ($includePublic) {
        $log('Executing public calendar lookup');
        $publicStmt = $pdo->prepare(
            "SELECT c.*
               FROM calendars_v1_tb AS c
              WHERE c.visibility = 'public'"
        );
        $publicStmt->execute();
        foreach ($publicStmt as $row) {
            $ensureCalendar($row, ($row['user_id'] ?? null) == $buwanaId ? 'personal' : 'public');
        }
    }

    $calendarIdsForItems = [];
    foreach ($calendars as $id => $calendar) {
        if (!$onlyActive || ($calendar['is_active'] && $calendar['display_enabled'])) {
            $calendarIdsForItems[] = $id;
        }
    }

    $itemCount = 0;
    if (!empty($calendarIdsForItems)) {
        $params = [];
        $placeholders = [];
        foreach (array_values($calendarIdsForItems) as $index => $calendarId) {
            $placeholderName = 'cal_' . $index;
            $placeholders[] = ':' . $placeholderName;
            $params[$placeholderName] = $calendarId;
        }

        $query = "SELECT i.item_id, i.calendar_id, i.uid, i.component_type, i.summary, i.description,
                         i.location, i.url, i.tzid, i.dtstart_utc, i.dtend_utc, i.due_utc, i.all_day,
                         i.pinned, i.item_emoji, i.item_color, i.percent_complete, i.priority, i.status,
                         i.completed_at, i.classification, i.created_at, i.updated_at
                    FROM items_v1_tb AS i
                   WHERE i.calendar_id IN (" . implode(',', $placeholders) . ")
                     AND (i.deleted_at IS NULL OR i.deleted_at = '0000-00-00 00:00:00')";
        if ($yearFilter !== null) {
            $query .= " AND ( (i.dtstart_utc IS NOT NULL AND YEAR(i.dtstart_utc) = :year_dtstart)"
                   . " OR (i.due_utc IS NOT NULL AND YEAR(i.due_utc) = :year_due) )";
            $params['year_dtstart'] = $yearFilter;
            $params['year_due'] = $yearFilter;
        }

        $log('Executing item lookup', ['calendar_ids' => $calendarIdsForItems, 'params' => array_keys($params)]);
        $itemStmt = $pdo->prepare($query);
        $itemStmt->execute($params);

        while ($row = $itemStmt->fetch(PDO::FETCH_ASSOC)) {
            $calendarId = (int)$row['calendar_id'];
            if (!isset($calendars[$calendarId])) {
                continue;
            }

            $item = [
                'item_id'          => (int)$row['item_id'],
                'calendar_id'      => $calendarId,
                'uid'              => $row['uid'],
                'component_type'   => $row['component_type'],
                'summary'          => $row['summary'],
                'description'      => $row['description'],
                'location'         => $row['location'],
                'url'              => $row['url'],
                'tzid'             => $row['tzid'],
                'dtstart_utc'      => $row['dtstart_utc'],
                'dtend_utc'        => $row['dtend_utc'],
                'due_utc'          => $row['due_utc'],
                'all_day'          => (int)$row['all_day'],
                'pinned'           => (int)$row['pinned'],
                'item_emoji'       => $row['item_emoji'],
                'item_color'       => $row['item_color'],
                'percent_complete' => isset($row['percent_complete']) ? (int)$row['percent_complete'] : null,
                'priority'         => isset($row['priority']) ? (int)$row['priority'] : null,
                'status'           => $row['status'],
                'completed_at'     => $row['completed_at'],
                'classification'   => $row['classification'],
                'created_at'       => $row['created_at'],
                'updated_at'       => $row['updated_at'],
            ];

            if ($yearFilter) {
                $matchYear = static function (?string $value) use ($yearFilter): bool {
                    if (!$value) {
                        return false;
                    }
                    return (int)substr($value, 0, 4) === $yearFilter;
                };

                if (!$matchYear($row['dtstart_utc']) && !$matchYear($row['due_utc'])) {
                    continue;
                }
            }

            $calendars[$calendarId]['items'][] = $item;
            $itemCount++;
        }
    }

    $log('Successfully assembled response', ['calendar_count' => count($calendars), 'item_count' => $itemCount]);
    echo json_encode([
        'ok' => true,
        'calendar_count' => count($calendars),
        'item_count' => $itemCount,
        'calendars' => array_values($calendars),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    $log('Unhandled error', ['exception' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'detail' => $e->getMessage(),
    ]);
}
