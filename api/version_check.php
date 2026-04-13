<?php
/**
 * EarthCal Version Check Endpoint
 *
 * GET /api/version_check.php
 * GET /api/version_check.php?app=EarthCal&current_version=1.3.7
 *
 * Returns the latest version info so macOS clients can determine
 * whether an update is available.
 *
 * To release a new version: edit /version.json at the repo root.
 */

// ── Safety: no error output to clients ─────────────────────────────────────
ini_set('display_errors', '0');
error_reporting(0);

// ── Helpers ─────────────────────────────────────────────────────────────────

function jsonError(int $code, string $message): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Compare two dotted version strings (e.g. "1.3.8" vs "1.3.7").
 * Returns  1 if $a > $b
 *          0 if $a == $b
 *         -1 if $a < $b
 */
function compareVersions(string $a, string $b): int {
    $partsA = array_map('intval', explode('.', $a));
    $partsB = array_map('intval', explode('.', $b));

    // Pad shorter array with zeros
    $len = max(count($partsA), count($partsB));
    while (count($partsA) < $len) $partsA[] = 0;
    while (count($partsB) < $len) $partsB[] = 0;

    foreach ($partsA as $i => $segA) {
        $segB = $partsB[$i];
        if ($segA > $segB) return  1;
        if ($segA < $segB) return -1;
    }
    return 0;
}

// ── Method guard ─────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    jsonError(405, 'Method Not Allowed');
}

// ── Load version config ───────────────────────────────────────────────────────
$configPath = __DIR__ . '/../version.json';

if (!file_exists($configPath) || !is_readable($configPath)) {
    jsonError(503, 'Version configuration unavailable');
}

$raw = file_get_contents($configPath);
if ($raw === false) {
    jsonError(503, 'Version configuration could not be read');
}

$cfg = json_decode($raw, true);
if (!is_array($cfg) || empty($cfg['version'])) {
    jsonError(503, 'Version configuration is malformed');
}

// ── Sanitize query parameters ─────────────────────────────────────────────────
$requestedApp     = isset($_GET['app'])             ? preg_replace('/[^a-zA-Z0-9\-_]/', '', (string) $_GET['app'])             : null;
$currentVersion   = isset($_GET['current_version']) ? preg_replace('/[^0-9.]/',          '', (string) $_GET['current_version']) : null;
$currentBuild     = isset($_GET['current_build'])   ? (int) $_GET['current_build']                                             : null;

// Optional app filter
if ($requestedApp !== null && strcasecmp($requestedApp, 'EarthCal') !== 0) {
    jsonError(400, 'Unknown app identifier');
}

// ── Build response ───────────────────────────────────────────────────────────
$latestVersion = (string) ($cfg['version']    ?? '');
$latestBuild   = (int)    ($cfg['build']      ?? 0);
$minVersion    = (string) ($cfg['minimum_supported_version'] ?? $latestVersion);
$downloadUrl   = (string) ($cfg['download_url']   ?? '');
$publishedAt   = (string) ($cfg['published_at']   ?? '');
$critical      = (bool)   ($cfg['critical']        ?? false);
$message       = (string) ($cfg['message']         ?? 'A new version of EarthCal is available.');

// Build release_notes_url from path
$notesPath = (string) ($cfg['release_notes_path'] ?? '');
$releaseNotesUrl = $notesPath ? 'https://earthcal.app' . ltrim($notesPath, '/') : '';

$response = [
    'app'                       => 'EarthCal',
    'latest_version'            => $latestVersion,
    'latest_build'              => $latestBuild,
    'minimum_supported_version' => $minVersion,
    'download_url'              => $downloadUrl,
    'release_notes_url'         => $releaseNotesUrl,
    'published_at'              => $publishedAt,
    'critical'                  => $critical,
    'message'                   => $message,
];

// ── Version comparison ────────────────────────────────────────────────────────
if ($currentVersion !== null && $currentVersion !== '') {
    $cmp = compareVersions($currentVersion, $latestVersion);

    if ($cmp < 0) {
        // Current version is older than latest
        $updateAvailable = true;
    } elseif ($cmp === 0 && $currentBuild !== null && $currentBuild < $latestBuild) {
        // Same version string but older build number
        $updateAvailable = true;
    } else {
        $updateAvailable = false;
    }

    $response['update_available'] = $updateAvailable;
}

// ── Output ────────────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');
header('X-Content-Type-Options: nosniff');

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
