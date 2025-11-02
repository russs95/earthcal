<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

// ---------------------------------------------------------
//  EARTHCAL v1  |  create_my_calendar.php
//  Creates default “My Calendar” for a given buwana_id
//  Updated for new MySQL v1 schema on Laravel server
// ---------------------------------------------------------

function rand_hex(int $bytes = 16): string { return bin2hex(random_bytes($bytes)); }
function rand_slug(int $len = 12): string {
  $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'; // URL-friendly, no ambiguous chars
  $s=''; for($i=0;$i<$len;$i++) $s .= $alphabet[random_int(0, strlen($alphabet)-1)];
  return $s;
}
function make_internal_subscription_url(string $type, int $uid, int $calId): string {
  return sprintf('earthcal://%s/%d/%d', $type, $uid, $calId);
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

  $checkOnly        = !empty($in['check_only']);
  $name             = trim((string)($in['name'] ?? 'My Calendar'));
  $tzidProvided     = array_key_exists('tzid', $in);
  $tzid_in          = $tzidProvided ? trim((string)($in['tzid'] ?? '')) : '';
  $color            = trim((string)($in['color'] ?? '#3b82f6'));
  $emojiProvided    = array_key_exists('emoji', $in);
  $emojiInput       = $emojiProvided ? trim((string)($in['emoji'] ?? '')) : '📆';
  $emoji            = $emojiInput !== '' ? $emojiInput : '📆';
  $descriptionProvided = array_key_exists('description', $in);
  $descriptionRaw   = $descriptionProvided ? trim((string)($in['description'] ?? '')) : '';
  $description      = $descriptionProvided ? ($descriptionRaw === '' ? null : $descriptionRaw) : null;
  $category         = trim((string)($in['category'] ?? 'personal'));
  $visibility       = trim((string)($in['visibility'] ?? 'private'));

  // ---------------------------------------------------------
  //  DATABASE CONNECTION (updated credentials)
  // ---------------------------------------------------------
  require_once __DIR__ . '/../pdo_connect.php';
  $pdo = earthcal_get_pdo();

  $pdo->beginTransaction();

  // 1️⃣ Confirm the user exists
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

  if ($checkOnly) {
    $pdo->commit();
    echo json_encode([
      'ok' => true,
      'exists' => true,
      'user' => [
        'buwana_id' => (int)$userRow['buwana_id'],
        'time_zone' => $userRow['time_zone'] ?? null,
      ],
    ]);
    exit;
  }

  // 2️⃣ Return existing default if present
  $chk = $pdo->prepare("SELECT calendar_id, name, default_my_calendar, description,
                               cal_emoji, color, tzid, category, visibility, is_readonly,
                               created_at, updated_at
                        FROM calendars_v1_tb
                        WHERE user_id = ? AND default_my_calendar = 1
                        LIMIT 1");
  $chk->execute([$buwana_id]);
  if ($existing = $chk->fetch()) {
    $updates = [];
    $params  = [];

    if ($emojiProvided && $emoji !== ($existing['cal_emoji'] ?? '')) {
      $updates[] = 'cal_emoji = ?';
      $params[] = $emoji;
      $existing['cal_emoji'] = $emoji;
    }

    if ($tzidProvided && $tzid_in !== '' && $tzid_in !== ($existing['tzid'] ?? '')) {
      $updates[] = 'tzid = ?';
      $params[] = $tzid_in;
      $existing['tzid'] = $tzid_in;
    }

    if ($descriptionProvided && $description !== ($existing['description'] ?? null)) {
      $updates[] = 'description = ?';
      $params[] = $description;
      $existing['description'] = $description;
    }

    if ($updates) {
      $params[] = $existing['calendar_id'];
      $sql = 'UPDATE calendars_v1_tb SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE calendar_id = ?';
      $pdo->prepare($sql)->execute($params);

      $refetch = $pdo->prepare("SELECT calendar_id, name, default_my_calendar, description,
                               cal_emoji, color, tzid, category, visibility, is_readonly,
                               created_at, updated_at
                        FROM calendars_v1_tb
                        WHERE calendar_id = ?
                        LIMIT 1");
      $refetch->execute([$existing['calendar_id']]);
      if ($fresh = $refetch->fetch()) {
        $existing = $fresh;
      }
    }

    $pdo->commit();
    echo json_encode([
      'ok' => true,
      'created' => false,
      'calendar' => $existing,
    ]);
    exit;
  }

  // 3️⃣ Create default calendar (ensure unique tokens)
  $share_slug = rand_slug(12);
  $feed_token = rand_hex(16);

  $ins = $pdo->prepare("
    INSERT INTO calendars_v1_tb
      (user_id, name, default_my_calendar, description, cal_emoji, color, tzid,
       category, visibility, is_readonly, share_slug, feed_token, created_at, updated_at)
    VALUES
      (?, ?, 1, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())
  ");
  $ins->execute([$buwana_id, $name, $description, $emoji, $color, $tzid, $category, $visibility, $share_slug, $feed_token]);
  $newId = (int)$pdo->lastInsertId();

  // Mark other calendars as non-default (safety)
  $pdo->prepare("UPDATE calendars_v1_tb SET default_my_calendar = 0 WHERE user_id = ? AND calendar_id <> ?")
      ->execute([$buwana_id, $newId]);

  // Fetch new calendar for return
  $row = $pdo->prepare("SELECT * FROM calendars_v1_tb WHERE calendar_id = ?");
  $row->execute([$newId]);
  $c = $row->fetch();

  // Ensure a matching subscription is created and active
  $subscriptionUrl = make_internal_subscription_url('personal', $buwana_id, $newId);
  $sub = $pdo->prepare("
    INSERT INTO subscriptions_v1_tb
      (user_id, calendar_id, source_type, url, url_hash, is_active, display_enabled, created_at, updated_at)
    VALUES
      (?, ?, 'personal', ?, ?, 1, 1, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      is_active = VALUES(is_active),
      display_enabled = VALUES(display_enabled),
      updated_at = VALUES(updated_at)
  ");
  $sub->execute([
    $buwana_id,
    $newId,
    $subscriptionUrl,
    hash('sha256', $subscriptionUrl),
  ]);

  $pdo->commit();

  echo json_encode([
    'ok' => true,
    'created' => true,
    'calendar' => $c,
  ]);

} catch (Throwable $e) {
  if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
