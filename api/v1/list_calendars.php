<?php
declare(strict_types=1);

require_once '../calconn_env.php';    // provides $cal_conn (mysqli)
require_once '../earthenAuth_helper.php';

header('Content-Type: application/json; charset=utf-8');

/* ---- CORS ---- */
$allowed_origins = ['https://ecobricks.org','https://earthcal.app','https://beta.earthcal.app','http://localhost','file://'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array(rtrim($origin, '/'), $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . rtrim($origin, '/'));
} elseif ($origin === '' || $origin === null) {
    header('Access-Control-Allow-Origin: *');
} else {
    http_response_code(403);
    echo json_encode(['ok'=>false,'error'=>'cors_denied']);
    exit;
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

/* ---- Input ---- */
$raw = file_get_contents('php://input');
$in  = json_decode($raw ?: '[]', true);
if (!is_array($in)) $in = $_POST;

$buwana_id = filter_var($in['buwana_id'] ?? null, FILTER_VALIDATE_INT);
if (!$buwana_id) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'buwana_id_required']);
    exit;
}

/* ---- Query ---- */
try {
    $sql = "SELECT calendar_id, name, default_my_calendar, description,
                   cal_emoji, color, tzid, category, visibility, is_readonly,
                   created_at, updated_at
            FROM calendars_v1_tb
            WHERE user_id = ?
            ORDER BY default_my_calendar DESC, name ASC";
    $stmt = $cal_conn->prepare($sql);
    if (!$stmt) { throw new Exception('prepare_failed: '.$cal_conn->error); }
    $stmt->bind_param('i', $buwana_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) { $rows[] = $r; }
    $stmt->close();

    $calendars = array_map(function($r){
        return [
            'calendar_id' => (int)$r['calendar_id'],
            'name'        => $r['name'],
            'is_default'  => (int)$r['default_my_calendar'] === 1,
            'description' => $r['description'],
            'emoji'       => $r['cal_emoji'],
            'color'       => $r['color'],
            'color_hex'   => $r['color'],
            'tzid'        => $r['tzid'],
            'category'    => $r['category'],
            'visibility'  => $r['visibility'],
            'is_readonly' => (int)$r['is_readonly'] === 1,
            'created_at'  => $r['created_at'],
            'updated_at'  => $r['updated_at'],
        ];
    }, $rows);

    echo json_encode(['ok'=>true, 'calendars'=>$calendars]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
