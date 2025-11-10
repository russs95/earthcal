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

try {
    require_once __DIR__ . '/../pdo_connect.php';
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect_failed', 'detail' => $e->getMessage()]);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
if (!is_array($input)) {
    $input = $_POST;
}

$buwanaId   = filter_var($input['buwana_id'] ?? null, FILTER_VALIDATE_INT);
$calendarId = filter_var($input['calendar_id'] ?? null, FILTER_VALIDATE_INT);

if (!$buwanaId || !$calendarId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_required_fields', 'need' => ['buwana_id', 'calendar_id']]);
    exit;
}

try {
    $calendarStmt = $pdo->prepare('SELECT calendar_id, user_id, name, description, tzid, cal_emoji FROM calendars_v1_tb WHERE calendar_id = :calendar_id LIMIT 1');
    $calendarStmt->execute(['calendar_id' => $calendarId]);
    $calendar = $calendarStmt->fetch(PDO::FETCH_ASSOC);

    if (!$calendar) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'calendar_not_found']);
        exit;
    }

    if ((int)$calendar['user_id'] !== $buwanaId) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden']);
        exit;
    }

    $itemsStmt = $pdo->prepare('
        SELECT item_id, summary, description, location, url, tzid, dtstart_utc, dtend_utc, due_utc,
               all_day, item_emoji, item_color, status, percent_complete, updated_at, created_at
          FROM items_v1_tb
         WHERE calendar_id = :calendar_id
           AND deleted_at IS NULL
         ORDER BY dtstart_utc ASC, item_id ASC
    ');
    $itemsStmt->execute(['calendar_id' => $calendarId]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

    $tzid = $calendar['tzid'] ?: 'Etc/UTC';
    $calendarName = $calendar['name'] ?: 'EarthCal Calendar';
    $calendarDescription = $calendar['description'] ?? '';

    $escape = static function (?string $value): string {
        if ($value === null) {
            return '';
        }
        $value = str_replace(['\\', ';', ',', "\r\n", "\r", "\n"], ['\\\\', '\\;', '\\,', '\\n', '\\n', '\\n'], $value);
        return $value;
    };

    $formatDateTime = static function (?string $dateTime, bool $allDay = false, bool $endDate = false) use ($tzid): ?string {
        if (!$dateTime) {
            return null;
        }

        try {
            $dt = new DateTime($dateTime, new DateTimeZone('UTC'));
        } catch (Throwable $e) {
            return null;
        }

        if ($allDay) {
            if ($endDate) {
                $dt->modify('+1 day');
            }
            return $dt->format('Ymd');
        }

        $dt->setTimezone(new DateTimeZone('UTC'));
        return $dt->format('Ymd\THis\Z');
    };

    $makeUid = static function (int $calendarId, int $itemId): string {
        return sprintf('earthcal-%d-%d@earthcal.app', $calendarId, $itemId);
    };

    $lines = [
        'BEGIN:VCALENDAR',
        'PRODID:-//EarthCal//EarthCal Export//EN',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'X-WR-CALNAME:' . $escape($calendarName),
        'X-WR-CALDESC:' . $escape($calendarDescription),
        'X-WR-TIMEZONE:' . $escape($tzid),
        'METHOD:PUBLISH'
    ];

    $nowStamp = (new DateTime('now', new DateTimeZone('UTC')))->format('Ymd\THis\Z');

    foreach ($items as $item) {
        $itemId = (int)$item['item_id'];
        $allDay = !empty($item['all_day']);
        $summary = $item['summary'] ?: 'Untitled Event';
        $description = $item['description'] ?? '';
        $location = $item['location'] ?? '';
        $url = $item['url'] ?? '';
        $dtstart = $formatDateTime($item['dtstart_utc'], $allDay, false);
        $dtend = $formatDateTime($item['dtend_utc'] ?: $item['due_utc'], $allDay, $allDay);
        $dtstamp = $formatDateTime($item['updated_at'] ?? $item['created_at'] ?? null, false, false) ?: $nowStamp;
        $status = $item['status'] ?? '';
        $percentComplete = is_numeric($item['percent_complete']) ? (int)$item['percent_complete'] : null;
        $emoji = $item['item_emoji'] ?? '';
        $color = $item['item_color'] ?? '';

        $lines[] = 'BEGIN:VEVENT';
        $lines[] = 'UID:' . $makeUid($calendarId, $itemId);
        $lines[] = 'DTSTAMP:' . $dtstamp;

        if ($dtstart !== null) {
            if ($allDay) {
                $lines[] = 'DTSTART;VALUE=DATE:' . $dtstart;
            } else {
                $lines[] = 'DTSTART:' . $dtstart;
            }
        }

        if ($dtend !== null) {
            if ($allDay) {
                $lines[] = 'DTEND;VALUE=DATE:' . $dtend;
            } else {
                $lines[] = 'DTEND:' . $dtend;
            }
        }

        $lines[] = 'SUMMARY:' . $escape($summary);

        if ($description !== '') {
            $lines[] = 'DESCRIPTION:' . $escape($description);
        }

        if ($location !== '') {
            $lines[] = 'LOCATION:' . $escape($location);
        }

        if ($url !== '') {
            $lines[] = 'URL:' . $escape($url);
        }

        if ($emoji !== '') {
            $lines[] = 'X-EARTHCAL-EMOJI:' . $escape($emoji);
        }

        if ($color !== '') {
            $lines[] = 'X-EARTHCAL-COLOR:' . $escape($color);
        }

        if ($status !== '') {
            $lines[] = 'STATUS:' . $escape(strtoupper($status));
        }

        if ($percentComplete !== null) {
            $lines[] = 'PERCENT-COMPLETE:' . max(0, min(100, $percentComplete));
        }

        $lines[] = 'END:VEVENT';
    }

    $lines[] = 'END:VCALENDAR';

    $ics = implode("\r\n", $lines) . "\r\n";

    $filenameBase = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $calendarName));
    $filenameBase = trim($filenameBase, '-') ?: 'earthcal-calendar';
    $filename = sprintf('%s-%d.ics', $filenameBase, $calendarId);

    header('Content-Type: text/calendar; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    header('X-Calendar-Filename: ' . $filename);

    echo $ics;
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'export_failed',
        'detail' => $e->getMessage(),
    ]);
}
