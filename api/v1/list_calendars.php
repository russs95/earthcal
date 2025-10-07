<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  $raw = file_get_contents('php://input');
  $in  = json_decode($raw ?: '[]', true);
  if (!is_array($in)) $in = $_POST;

  $buwana_id = filter_var($in['buwana_id'] ?? null, FILTER_VALIDATE_INT);
  if (!$buwana_id) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'buwana_id is required']);
    exit;
  }

  // ---- DB connect (env-first; edit defaults to match your server) ----
  $host = getenv('MYSQL_HOST')     ?: '127.0.0.1';
  $db   = getenv('MYSQL_DATABASE') ?: 'ecobricks_earthcal_db';
  $user = getenv('MYSQL_USER')     ?: 'root';
  $pass = getenv('MYSQL_PASSWORD') ?: '';
  $port = getenv('MYSQL_PORT')     ?: '3306';

  $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4",$user,$pass,[
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);

  $sql = "SELECT calendar_id, name, default_my_calendar, description,
                 cal_emoji, color, tzid, category, visibility, is_readonly,
                 created_at, updated_at
          FROM calendars_v1_tb
          WHERE user_id = ?
          ORDER BY default_my_calendar DESC, name ASC";
  $stmt = $pdo->prepare($sql);
  $stmt->execute([$buwana_id]);

  $rows = $stmt->fetchAll();

  // Map DB → API shape (keep friendly aliases the JS expects)
  $calendars = array_map(function($r){
    return [
      'calendar_id' => (int)$r['calendar_id'],
      'name'        => $r['name'],
      'is_default'  => (int)$r['default_my_calendar'] === 1,
      'description' => $r['description'],
      'emoji'       => $r['cal_emoji'],
      'color'       => $r['color'],
      'color_hex'   => $r['color'],     // alias for existing JS normalizer
      'tzid'        => $r['tzid'],
      'category'    => $r['category'],
      'visibility'  => $r['visibility'],
      'is_readonly' => (int)$r['is_readonly'] === 1,
      'created_at'  => $r['created_at'],
      'updated_at'  => $r['updated_at'],
    ];
  }, $rows);

  echo json_encode(['ok' => true, 'calendars' => $calendars]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'server_error', 'detail' => $e->getMessage()]);
}
