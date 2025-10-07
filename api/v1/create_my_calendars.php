<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

function rand_hex(int $bytes = 16): string { return bin2hex(random_bytes($bytes)); }
function rand_slug(int $len = 12): string {
  $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'; // URL-friendly, no ambiguous chars
  $s=''; for($i=0;$i<$len;$i++) $s .= $alphabet[random_int(0, strlen($alphabet)-1)];
  return $s;
}

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

  $name      = trim((string)($in['name'] ?? 'My Calendar'));
  $tzid_in   = trim((string)($in['tzid'] ?? ''));
  $color     = trim((string)($in['color'] ?? '#3b82f6'));
  $emoji     = trim((string)($in['emoji'] ?? '📅'));
  $category  = trim((string)($in['category'] ?? 'personal'));
  $visibility= trim((string)($in['visibility'] ?? 'private'));

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

  $pdo->beginTransaction();

  // 1) Verify user exists and pick TZID fallback from users_tb
  $u = $pdo->prepare("SELECT buwana_id, time_zone FROM users_tb WHERE buwana_id = ? LIMIT 1");
  $u->execute([$buwana_id]);
  $userRow = $u->fetch();
  if (!$userRow) {
    $pdo->rollBack();
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'user_not_found']);
    exit;
  }
  $tzid = $tzid_in ?: ($userRow['time_zone'] ?: 'Etc/UTC');

  // 2) If a default already exists, return it
  $chk = $pdo->prepare("SELECT calendar_id, name, default_my_calendar, description,
                               cal_emoji, color, tzid, category, visibility, is_readonly,
                               created_at, updated_at
                        FROM calendars_v1_tb
                        WHERE user_id = ? AND default_my_calendar = 1
                        LIMIT 1");
  $chk->execute([$buwana_id]);
  if ($existing = $chk->fetch()) {
    $pdo->commit();
    echo json_encode([
      'ok' => true,
      'created' => false,
      'calendar' => [
        'calendar_id' => (int)$existing['calendar_id'],
        'name'        => $existing['name'],
        'is_default'  => true,
        'description' => $existing['description'],
        'emoji'       => $existing['cal_emoji'],
        'color'       => $existing['color'],
        'color_hex'   => $existing['color'],
        'tzid'        => $existing['tzid'],
        'category'    => $existing['category'],
        'visibility'  => $existing['visibility'],
        'is_readonly' => (int)$existing['is_readonly'] === 1,
        'created_at'  => $existing['created_at'],
        'updated_at'  => $existing['updated_at'],
      ]
    ]);
    exit;
  }

  // 3) Create default calendar (ensure unique tokens)
  $share_slug = rand_slug(12);
  $feed_token = rand_hex(16);

  // Rare collision handling: retry a couple times
  $tries = 0;
  do {
    try {
      $ins = $pdo->prepare(
        "INSERT INTO calendars_v1_tb
          (user_id, name, default_my_calendar, description, cal_emoji, color, tzid, category,
           visibility, is_readonly, share_slug, feed_token, created_at, updated_at)
         VALUES
          (?, ?, 1, NULL, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())"
      );
      $ins->execute([$buwana_id, $name, $emoji, $color, $tzid, $category, $visibility, $share_slug, $feed_token]);
      $newId = (int)$pdo->lastInsertId();

      // (Optional safety) Ensure any other calendars for this user are marked non-default
      $pdo->prepare("UPDATE calendars_v1_tb SET default_my_calendar = 0 WHERE user_id = ? AND calendar_id <> ?")
          ->execute([$buwana_id, $newId]);

      // Fetch for return
      $row = $pdo->prepare("SELECT calendar_id, name, default_my_calendar, description,
                                   cal_emoji, color, tzid, category, visibility, is_readonly,
                                   created_at, updated_at
                            FROM calendars_v1_tb WHERE calendar_id = ?");
      $row->execute([$newId]);
      $c = $row->fetch();

      $pdo->commit();
      echo json_encode([
        'ok' => true,
        'created' => true,
        'calendar' => [
          'calendar_id' => (int)$c['calendar_id'],
          'name'        => $c['name'],
          'is_default'  => true,
          'description' => $c['description'],
          'emoji'       => $c['cal_emoji'],
          'color'       => $c['color'],
          'color_hex'   => $c['color'],
          'tzid'        => $c['tzid'],
          'category'    => $c['category'],
          'visibility'  => $c['visibility'],
          'is_readonly' => (int)$c['is_readonly'] === 1,
          'created_at'  => $c['created_at'],
          'updated_at'  => $c['updated_at'],
        ]
      ]);
      exit;
    } catch (PDOException $e) {
      // Duplicate slug/token? try again a couple times
      if ($e->errorInfo[1] == 1062 && $tries < 2) { // ER_DUP_ENTRY
        $share_slug = rand_slug(12);
        $feed_token = rand_hex(16);
        $tries++;
        continue;
      }
      throw $e;
    }
  } while ($tries < 3);

} catch (Throwable $e) {
  if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
