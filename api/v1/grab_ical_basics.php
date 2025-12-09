<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| grab_ical_basics.php — EarthCal v1.0
|--------------------------------------------------------------------------
| Purpose:
|   Given a public iCal (.ics) or webcal:// URL, this API:
|     1. Validates reachability of the feed
|     2. Confirms it contains a valid VCALENDAR
|     3. Extracts key metadata (name, description, etc.)
|     4. Counts number of events
|     5. Returns basic preview data to front-end JS
|
| No database writes occur — this API is read-only.
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');

/* ----------------------------- CORS ----------------------------- */
$allowed_origins = [
    'https://earthcal.app',
    // EarthCal desktop / local dev:
    'http://127.0.0.1:3000',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== null) {
    $trimmed = rtrim($origin, '/');
    if (in_array($trimmed, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $trimmed);
    } else {
        http_response_code(403);
        echo json_encode(['ok'=>false,'error'=>'cors_denied']);
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
    echo json_encode(['ok'=>false,'error'=>'invalid_method']);
    exit;
}

/* --------------------------- INPUT ----------------------------- */
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '[]', true);
if (!is_array($data)) $data = $_POST;

$icalUrl = trim((string)($data['ical_url'] ?? ''));

if ($icalUrl === '') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'ical_url_required']);
    exit;
}

/* -------------------- 1. Normalize URL --------------------------
 * Convert webcal:// → https://  (standard for public feeds)
 ------------------------------------------------------------------*/
$icalUrl = preg_replace('/^webcal:/i', 'https:', $icalUrl);

/* -------------------- 2. Fetch Feed -----------------------------
 * We use cURL for HTTPS robustness.
 ------------------------------------------------------------------*/
function fetch_ical_content(string $url): string
{
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_USERAGENT      => 'EarthCal iCal Grabber/1.0'
    ]);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($result === false) {
        throw new Exception("Curl failed: $error");
    }
    if ($httpCode < 200 || $httpCode >= 300) {
        throw new Exception("HTTP $httpCode from feed");
    }
    if (stripos((string)$contentType, 'text/calendar') === false
        && stripos((string)$contentType, 'text/plain') === false) {
        // Still allow some Google feeds served as text/plain
        if (stripos($result, 'BEGIN:VCALENDAR') === false) {
            throw new Exception("Invalid content type or not an ICS feed");
        }
    }

    return $result;
}

try {
    $icalData = fetch_ical_content($icalUrl);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'ok'=>false,
        'error'=>'fetch_failed',
        'detail'=>$e->getMessage()
    ]);
    exit;
}

// Normalise encoding and strip any byte-order mark so downstream parsing works consistently.
if (strncmp($icalData, "\xEF\xBB\xBF", 3) === 0) {
    $icalData = substr($icalData, 3);
} elseif (strncmp($icalData, "\xFE\xFF", 2) === 0) {
    $converted = function_exists('mb_convert_encoding')
        ? @mb_convert_encoding($icalData, 'UTF-8', 'UTF-16BE')
        : @iconv('UTF-16BE', 'UTF-8//IGNORE', $icalData);
    if (is_string($converted)) {
        $icalData = $converted;
    }
} elseif (strncmp($icalData, "\xFF\xFE", 2) === 0) {
    $converted = function_exists('mb_convert_encoding')
        ? @mb_convert_encoding($icalData, 'UTF-8', 'UTF-16LE')
        : @iconv('UTF-16LE', 'UTF-8//IGNORE', $icalData);
    if (is_string($converted)) {
        $icalData = $converted;
    }
}

/* -------------------- 3. Validate ICS Format -------------------- */
if (stripos($icalData, 'BEGIN:VCALENDAR') === false) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'not_ical']);
    exit;
}

/* -------------------- 4. Parse Header Info ----------------------
 * We only need the lightweight lines:
 *   X-WR-CALNAME, X-WR-CALDESC, PRODID, VERSION, etc.
 ------------------------------------------------------------------*/
function extract_header_field(string $data, string $key): ?string {
    $pattern = '/^' . preg_quote($key, '/') . ':(.+)$/mi';
    if (preg_match($pattern, $data, $m)) {
        return trim($m[1]);
    }
    return null;
}

$feedTitle = extract_header_field($icalData, 'X-WR-CALNAME')
    ?? extract_header_field($icalData, 'SUMMARY')
    ?? 'Unnamed Calendar';
$feedDesc  = extract_header_field($icalData, 'X-WR-CALDESC')
    ?? extract_header_field($icalData, 'DESCRIPTION')
    ?? '';

/* -------------------- 5. Count Events ---------------------------
 * Count "BEGIN:VEVENT" lines for event items.
 ------------------------------------------------------------------*/
$eventCount = preg_match_all('/^BEGIN:VEVENT/im', $icalData, $m);

/* -------------------- 6. Collect Sample Items ------------------- */
$sampleItems = [];
if (preg_match_all('/BEGIN:VEVENT(.*?)END:VEVENT/si', $icalData, $matches)) {
    foreach ($matches[1] as $chunk) {
        if (preg_match('/SUMMARY:(.+)/i', $chunk, $sum) &&
            preg_match('/DTSTART.*:(\d{8})/i', $chunk, $start)) {
            $sampleItems[] = [
                'summary' => trim($sum[1]),
                'dtstart' => trim($start[1])
            ];
        }
        if (count($sampleItems) >= 3) break; // limit preview
    }
}

/* -------------------- 7. Compute Size --------------------------- */
$bytes = strlen($icalData);
$sizeKb = round($bytes / 1024, 1);

/* -------------------- 8. Guess Color ----------------------------
 * (Optional) We give a default color for preview.
 ------------------------------------------------------------------*/
$defaultColor = '#3b82f6'; // EarthCal blue

/* -------------------- 9. Return JSON ----------------------------- */
echo json_encode([
    'ok'            => true,
    'ical_url'      => $icalUrl,
    'feed_title'    => $feedTitle,
    'description'   => $feedDesc,
    'item_count'    => $eventCount,
    'size_kb'       => $sizeKb,
    'default_color' => $defaultColor,
    'sample_items'  => $sampleItems
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
