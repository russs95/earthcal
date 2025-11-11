<?php
declare(strict_types=1);

/**
 * Stripe Webhook Handler
 *
 * Handles subscription lifecycle + checkout completion.
 * Uses lookup_key on Stripe Price to map → plan_id in plans_tb.
 */

header('Content-Type: application/json; charset=utf-8');

// ======================================================
// LOAD STRIPE + ENV
// ======================================================

$env = require __DIR__ . "/../stripe_env.php";
/**
 * $env = [
 *   'STRIPE_SECRET_KEY'     => "...",
 *   'STRIPE_WEBHOOK_SECRET' => "...",
 *   'STRIPE_PUBLIC_KEY'     => "..."
 * ]
 */

$STRIPE_WEBHOOK_SECRET = $env['STRIPE_WEBHOOK_SECRET'] ?? null;

if (!$STRIPE_WEBHOOK_SECRET) {
    error_log("stripe_webhook.php: Missing STRIPE_WEBHOOK_SECRET");
    http_response_code(500);
    echo json_encode(['error' => 'Webhook secret not configured']);
    exit;
}

// ======================================================
// CONNECT DB
// ======================================================
require_once __DIR__ . '/../pdo_connect.php';

try {
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    error_log("stripe_webhook.php: DB connect failed - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'DB connect failed']);
    exit;
}

// ======================================================
// READ + VERIFY STRIPE EVENT
// NOTE: Must use raw body for signature verification
// ======================================================
$payload = @file_get_contents('php://input');
$sig     = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

try {
    $event = \Stripe\Webhook::constructEvent(
        $payload,
        $sig,
        $STRIPE_WEBHOOK_SECRET
    );
} catch (\UnexpectedValueException $e) {
    http_response_code(400);
    echo "Invalid payload";
    exit;
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    echo "Invalid signature";
    exit;
}

// ======================================================
// HELPERS
// ======================================================

/**
 * Look up user by stripe_customer_id
 */
function find_user_by_stripe_customer(PDO $pdo, string $stripe_customer_id): ?array {
    $stmt = $pdo->prepare("
        SELECT buwana_id
        FROM users_tb
        WHERE stripe_customer_id = ?
        LIMIT 1
    ");
    $stmt->execute([$stripe_customer_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * Find plan_id from lookup_key in plans_tb
 */
function map_price_lookup_to_plan_id(PDO $pdo, string $lookup_key): ?int {
    $stmt = $pdo->prepare("
        SELECT plan_id
        FROM plans_tb
        WHERE lookup_key = ?
        LIMIT 1
    ");

    try {
        $stmt->execute([$lookup_key]);
    } catch (PDOException $e) {
        // Some databases may not yet have the lookup_key column deployed.
        error_log('stripe_webhook.php: plan lookup by lookup_key failed - ' . $e->getMessage());
        return null;
    }

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? (int)$row['plan_id'] : null;
}

/**
 * Find plan_id from slug in plans_tb
 */
function map_plan_slug_to_plan_id(PDO $pdo, string $slug): ?int {
    $stmt = $pdo->prepare("
        SELECT plan_id
        FROM plans_tb
        WHERE slug = ?
        LIMIT 1
    ");
    $stmt->execute([$slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? (int)$row['plan_id'] : null;
}

function normalize_stripe_value($source, string $key)
{
    if (is_array($source)) {
        return $source[$key] ?? null;
    }

    if (is_object($source)) {
        return $source->$key ?? null;
    }

    return null;
}

function stripe_object_to_array($value): array
{
    if (is_array($value)) {
        return $value;
    }

    if (is_object($value)) {
        if (method_exists($value, 'toArray')) {
            return $value->toArray();
        }

        return (array)$value;
    }

    return [];
}

function slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/i', '_', $value);
    return trim($value, '_');
}

function format_stripe_timestamp($timestamp): ?string
{
    if ($timestamp === null || $timestamp === '') {
        return null;
    }

    if (is_string($timestamp) && ctype_digit($timestamp)) {
        $timestamp = (int)$timestamp;
    }

    if (!is_int($timestamp)) {
        return null;
    }

    try {
        return (new \DateTimeImmutable('@' . $timestamp))
            ->setTimezone(new \DateTimeZone('UTC'))
            ->format('Y-m-d H:i:s');
    } catch (\Throwable $e) {
        error_log('stripe_webhook.php: unable to format timestamp ' . $timestamp . ' - ' . $e->getMessage());
        return null;
    }
}

function resolve_plan_id_from_price(PDO $pdo, $price): ?int
{
    $candidates = [];

    $lookupKey = normalize_stripe_value($price, 'lookup_key');
    if (is_string($lookupKey) && $lookupKey !== '') {
        $candidates[] = $lookupKey;
    }

    $metadata = stripe_object_to_array(normalize_stripe_value($price, 'metadata'));
    if (!empty($metadata)) {
        if (isset($metadata['plan_id']) && is_numeric($metadata['plan_id'])) {
            return (int)$metadata['plan_id'];
        }

        foreach (['plan_slug', 'slug', 'plan', 'lookup_key'] as $metaKey) {
            if (!empty($metadata[$metaKey]) && is_string($metadata[$metaKey])) {
                $candidates[] = $metadata[$metaKey];
            }
        }
    }

    $product = normalize_stripe_value($price, 'product');

    if (is_string($product) && $product !== '') {
        try {
            $product = \Stripe\Product::retrieve($product);
        } catch (\Throwable $e) {
            error_log('stripe_webhook.php: unable to load Stripe product ' . $product . ' - ' . $e->getMessage());
            $product = null;
        }
    }

    if ($product && !is_string($product)) {
        $productMetadata = stripe_object_to_array(normalize_stripe_value($product, 'metadata'));
        if (!empty($productMetadata)) {
            if (isset($productMetadata['plan_id']) && is_numeric($productMetadata['plan_id'])) {
                return (int)$productMetadata['plan_id'];
            }

            foreach (['plan_slug', 'slug', 'plan'] as $metaKey) {
                if (!empty($productMetadata[$metaKey]) && is_string($productMetadata[$metaKey])) {
                    $candidates[] = $productMetadata[$metaKey];
                }
            }
        }
    }

    $nickname = normalize_stripe_value($price, 'nickname');
    if (is_string($nickname) && $nickname !== '') {
        $candidates[] = $nickname;
    }

    $finalCandidates = [];
    foreach ($candidates as $candidate) {
        if (!is_string($candidate) || $candidate === '') {
            continue;
        }

        $finalCandidates[] = $candidate;

        $slugCandidate = slugify($candidate);
        if ($slugCandidate !== $candidate) {
            $finalCandidates[] = $slugCandidate;
        }

        $segments = preg_split('/[_\-]/', $slugCandidate);
        if (!empty($segments)) {
            $finalCandidates = array_merge($finalCandidates, $segments);
        }
    }

    $finalCandidates = array_values(array_unique(array_filter($finalCandidates)));

    foreach ($finalCandidates as $candidate) {
        $planId = map_price_lookup_to_plan_id($pdo, $candidate);
        if ($planId) {
            return $planId;
        }

        $planId = map_plan_slug_to_plan_id($pdo, $candidate);
        if ($planId) {
            return $planId;
        }
    }

    $priceId = normalize_stripe_value($price, 'id');
    $lookupDebug = $lookupKey ?: 'none';
    error_log(sprintf(
        'stripe_webhook.php: Unable to resolve plan for price %s (lookup_key=%s, candidates=%s)',
        $priceId ?: 'unknown',
        $lookupDebug,
        json_encode($finalCandidates)
    ));

    return null;
}

/**
 * Upsert subscription → user_subscriptions_tb
 */
function find_or_create_subscription(
    PDO $pdo,
    int $buwana_id,
    int $plan_id,
    string $stripe_subscription_id,
    ?string $coupon_code,
    ?string $start_at,
    ?string $current_period_end
): int {

    // Existing?
    $check = $pdo->prepare("
        SELECT subscription_id
        FROM user_subscriptions_tb
        WHERE user_id = :uid
        AND external_subscription_id = :ext
        LIMIT 1
    ");
    $check->execute([
        'uid' => $buwana_id,
        'ext' => $stripe_subscription_id,
    ]);

    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $subscription_id = (int)$existing['subscription_id'];
        $update = $pdo->prepare("
            UPDATE user_subscriptions_tb
            SET plan_id = :plan,
                status = 'active',
                coupon_code = :coupon,
                start_at = :startat,
                current_period_end = :cpe,
                updated_at = NOW()
            WHERE subscription_id = :sid
        ");
        $update->execute([
            'plan'     => $plan_id,
            'coupon'   => $coupon_code,
            'startat'  => $start_at,
            'cpe'      => $current_period_end,
            'sid'      => $subscription_id
        ]);
        return $subscription_id;
    }

    // New
    $insert = $pdo->prepare("
        INSERT INTO user_subscriptions_tb
        (user_id, plan_id, status, is_gift, coupon_code, external_provider,
         external_subscription_id, start_at, current_period_end, created_at, updated_at)
        VALUES
        (:uid, :plan, 'active', 0, :coupon, 'stripe', :ext,
         :startat, :cpe, NOW(), NOW())
    ");
    $insert->execute([
        'uid'     => $buwana_id,
        'plan'    => $plan_id,
        'coupon'  => $coupon_code,
        'ext'     => $stripe_subscription_id,
        'startat' => $start_at,
        'cpe'     => $current_period_end,
    ]);

    return (int)$pdo->lastInsertId();
}


// ======================================================
// PROCESS EVENT
// ======================================================

$type = $event['type'] ?? '';
$data = $event['data']['object'] ?? [];

try {

    switch ($type) {

    // ==================================================
    // checkout.session.completed
    // ==================================================
    case 'checkout.session.completed':

        $customer     = $data['customer']     ?? null;
        $subscription = $data['subscription'] ?? null;
        $metadata     = $data['metadata']     ?? [];

        if (!$customer) break;

        // Assign user
        $user = find_user_by_stripe_customer($pdo, $customer);

        if (!$user) {
            // First-time checkout — metadata must include buwana_id
            if (!empty($metadata['buwana_id'])) {
                $buwana_id = (int)$metadata['buwana_id'];
                $stmt = $pdo->prepare("
                    UPDATE users_tb
                    SET stripe_customer_id = :cid
                    WHERE buwana_id = :bid
                ");
                $stmt->execute([
                    'cid' => $customer,
                    'bid' => $buwana_id,
                ]);
            } else {
                break;
            }
        } else {
            $buwana_id = (int)$user['buwana_id'];
        }

        // Subscription exists?
        if ($subscription) {

            try {
                $subObj = \Stripe\Subscription::retrieve([
                    'id'     => $subscription,
                    'expand' => ['items.data.price', 'items.data.price.product']
                ]);
            } catch (\Stripe\Exception\ApiErrorException $e) {
                error_log('stripe_webhook.php: unable to retrieve subscription ' . $subscription . ' - ' . $e->getMessage() . ' (check test vs live API keys)');
                break;
            } catch (\Throwable $e) {
                error_log('stripe_webhook.php: unexpected error retrieving subscription ' . $subscription . ' - ' . $e->getMessage());
                break;
            }

            $price = $subObj->items->data[0]->price ?? null;

            if ($price) {
                $plan_id = resolve_plan_id_from_price($pdo, $price);

                if ($plan_id) {
                    $coupon_code = null;
                    if (isset($subObj->discount) && $subObj->discount) {
                        $coupon = $subObj->discount->coupon ?? null;
                        if ($coupon && isset($coupon->name)) {
                            $coupon_code = $coupon->name;
                        }
                    }

                    $start_at = format_stripe_timestamp($subObj->start_date ?? null);
                    $period_end = format_stripe_timestamp($subObj->current_period_end ?? null);

                    find_or_create_subscription(
                        $pdo,
                        $buwana_id,
                        $plan_id,
                        $subscription,
                        $coupon_code,
                        $start_at,
                        $period_end
                    );
                }
            }
        }

        break;


    // ==================================================
    // customer.subscription.updated
    // ==================================================
    case 'customer.subscription.updated':
        $subObj = $data;

        $stripe_subscription_id = $subObj['id'];
        $customer               = $subObj['customer'];

        $user = find_user_by_stripe_customer($pdo, $customer);
        if (!$user) break;

        $buwana_id = (int)$user['buwana_id'];

        $price = $subObj['items']['data'][0]['price'] ?? null;
        $plan_id = $price ? resolve_plan_id_from_price($pdo, $price) : null;

        $coupon_code = null;
        if (!empty($subObj['discount']['coupon']['name'])) {
            $coupon_code = $subObj['discount']['coupon']['name'];
        }

        $start_at = format_stripe_timestamp($subObj['start_date'] ?? null);
        $period_end  = format_stripe_timestamp($subObj['current_period_end'] ?? null);

        if ($plan_id) {
            find_or_create_subscription(
                $pdo,
                $buwana_id,
                $plan_id,
                $stripe_subscription_id,
                $coupon_code,
                $start_at,
                $period_end
            );
        }

        // Cancellation at period end
        if (!empty($subObj['cancel_at_period_end'])) {
            $stmt = $pdo->prepare("
                UPDATE user_subscriptions_tb
                SET status='canceled',
                    cancel_at = :cancel_at,
                    updated_at = NOW()
                WHERE user_id = :uid
                AND external_subscription_id = :sid
            ");
            $stmt->execute([
                'cancel_at' => $period_end,
                'uid'       => $buwana_id,
                'sid'       => $stripe_subscription_id,
            ]);
        }

        break;


    // ==================================================
    // customer.subscription.deleted
    // ==================================================
    case 'customer.subscription.deleted':
        $subObj = $data;

        $stripe_subscription_id = $subObj['id'];
        $customer               = $subObj['customer'];

        $user = find_user_by_stripe_customer($pdo, $customer);
        if (!$user) break;

        $buwana_id = (int)$user['buwana_id'];

        $stmt = $pdo->prepare("
            UPDATE user_subscriptions_tb
            SET status='canceled',
                canceled_at = NOW(),
                updated_at = NOW()
            WHERE user_id = :uid
            AND external_subscription_id = :sid
        ");
        $stmt->execute([
            'uid' => $buwana_id,
            'sid' => $stripe_subscription_id,
        ]);

        break;
    }

} catch (\Throwable $e) {
    error_log('stripe_webhook.php: fatal handler error - ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'internal handler error']);
    exit;
}


// ======================================================
// SUCCESS
// ======================================================
http_response_code(200);
echo json_encode(['received' => true]);
