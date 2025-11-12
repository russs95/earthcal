<?php
declare(strict_types=1);

/**
 * Stripe Webhook — EarthCal
 *
 * Handles:
 *   ✅ checkout.session.completed
 *   ✅ customer.subscription.updated
 *   ✅ customer.subscription.deleted
 *
 * Key Assumptions:
 *   - plans_tb contains lookup_key that matches Stripe Price lookup_key
 *   - users_tb has stripe_customer_id
 *   - user_subscriptions_tb tracks plan + provider
 */

header("Content-Type: application/json; charset=utf-8");

/* -------------------------------------------------------
   LOAD STRIPE + ENV
------------------------------------------------------- */

$env = require __DIR__ . "/../stripe_env.php";

$STRIPE_WEBHOOK_SECRET = $env["STRIPE_WEBHOOK_SECRET"] ?? null;
if (!$STRIPE_WEBHOOK_SECRET) {
    error_log("stripe_webhook.php: Missing STRIPE_WEBHOOK_SECRET");
    http_response_code(500);
    exit("Webhook secret not configured");
}

// ✅ Load Composer autoloader
$autoload = __DIR__ . "/../../vendor/autoload.php";
if (!file_exists($autoload)) {
    error_log("stripe_webhook.php: vendor/autoload.php missing!");
    http_response_code(500);
    exit("Stripe SDK missing");
}
require_once $autoload;

/* -------------------------------------------------------
   DB
------------------------------------------------------- */
require_once __DIR__ . "/../pdo_connect.php";

try {
    $pdo = earthcal_get_pdo();
} catch (Throwable $e) {
    error_log("stripe_webhook.php: DB connect failed: " . $e->getMessage());
    http_response_code(500);
    exit("DB connect failed");
}

/* -------------------------------------------------------
   STRIPE VERIFY
------------------------------------------------------- */

$payload    = @file_get_contents("php://input");
$sig        = $_SERVER["HTTP_STRIPE_SIGNATURE"] ?? "";

try {
    $event = \Stripe\Webhook::constructEvent(
        $payload,
        $sig,
        $STRIPE_WEBHOOK_SECRET
    );
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    error_log("stripe_webhook.php: Invalid signature");
    http_response_code(400);
    exit("Invalid signature");
} catch (Exception $e) {
    error_log("stripe_webhook.php: Invalid payload — " . $e->getMessage());
    http_response_code(400);
    exit("Invalid payload");
}

$type = $event["type"] ?? "unknown";
$data = $event["data"]["object"] ?? [];
error_log("stripe_webhook.php: Received event {$type}");


/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function find_user_by_customer(PDO $pdo, string $customer): ?int {
    $stmt = $pdo->prepare("
        SELECT buwana_id
        FROM users_tb
        WHERE stripe_customer_id = ?
        LIMIT 1
    ");
    $stmt->execute([$customer]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? (int)$row["buwana_id"] : null;
}

function lookup_plan_id(PDO $pdo, string $lookup): ?int {
    $stmt = $pdo->prepare("
        SELECT plan_id
        FROM plans_tb
        WHERE lookup_key = ?
        LIMIT 1
    ");
    $stmt->execute([$lookup]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? (int)$row["plan_id"] : null;
}

function upsert_subscription(
    PDO $pdo,
    int $buwana_id,
    int $plan_id,
    string $stripe_subscription_id,
    ?int $current_period_end
): void {

    // UPDATE
    $stmt = $pdo->prepare("
        SELECT subscription_id
        FROM user_subscriptions_tb
        WHERE external_subscription_id = ?
        AND user_id = ?
        LIMIT 1
    ");
    $stmt->execute([$stripe_subscription_id, $buwana_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $update = $pdo->prepare("
            UPDATE user_subscriptions_tb
            SET plan_id = :plan,
                status = 'active',
                current_period_end = :end_at,
                updated_at = NOW()
            WHERE subscription_id = :sid
        ");
        $update->execute([
            "plan"   => $plan_id,
            "end_at" => $current_period_end ? date("Y-m-d H:i:s", $current_period_end) : null,
            "sid"    => $existing["subscription_id"]
        ]);
        return;
    }

    // INSERT
    $insert = $pdo->prepare("
        INSERT INTO user_subscriptions_tb
        (user_id, plan_id, status, external_provider, external_subscription_id,
         current_period_end, created_at, updated_at)
        VALUES
        (:uid, :plan, 'active', 'stripe', :subid, :end_at, NOW(), NOW())
    ");
    $insert->execute([
        "uid"   => $buwana_id,
        "plan"  => $plan_id,
        "subid" => $stripe_subscription_id,
        "end_at"=> $current_period_end ? date("Y-m-d H:i:s", $current_period_end) : null
    ]);
}


/* -------------------------------------------------------
   EVENT HANDLING
------------------------------------------------------- */

switch ($type) {


/* ✅ 1. Checkout Completed → Establish subscription */
case "checkout.session.completed":
    $customer     = $data["customer"]     ?? null;
    $subscription = $data["subscription"] ?? null;
    $metadata     = $data["metadata"]     ?? [];

    if (!$customer) {
        error_log("checkout.session.completed: missing customer");
        break;
    }

    // First purchase may not yet have stripe_customer_id mapped
    $buwana_id = find_user_by_customer($pdo, $customer);
    if (!$buwana_id && !empty($metadata["buwana_id"])) {
        $buwana_id = (int)$metadata["buwana_id"];

        $stmt = $pdo->prepare("
            UPDATE users_tb SET stripe_customer_id = :cid
            WHERE buwana_id = :bid
        ");
        $stmt->execute(["cid" => $customer, "bid" => $buwana_id]);

        error_log("Associated customer {$customer} → user {$buwana_id}");
    }

    if (!$subscription || !$buwana_id) break;

    $sub = \Stripe\Subscription::retrieve([
        "id"     => $subscription,
        "expand" => ["items.data.price"]
    ]);

    $price      = $sub->items->data[0]->price ?? null;
    $lookup_key = $price->lookup_key ?? null;
    $period_end = $sub->current_period_end ?? null;

    if (!$lookup_key) {
        error_log("checkout.session.completed: No lookup_key on price");
        break;
    }

    $plan_id = lookup_plan_id($pdo, $lookup_key);
    if (!$plan_id) {
        error_log("checkout.session.completed: No plan match for {$lookup_key}");
        break;
    }

    upsert_subscription($pdo, $buwana_id, $plan_id, $subscription, $period_end);
    break;


/* ✅ 2. Subscription Updated (renewed, plan changed, etc.) */
case "customer.subscription.updated":
    $sub             = $data;
    $subscription_id = $sub["id"];
    $customer        = $sub["customer"];

    $buwana_id = find_user_by_customer($pdo, $customer);
    if (!$buwana_id) break;

    $price      = $sub["items"]["data"][0]["price"] ?? null;
    $lookup_key = $price["lookup_key"] ?? null;
    $period_end = $sub["current_period_end"] ?? null;

    if (!$lookup_key) break;

    $plan_id = lookup_plan_id($pdo, $lookup_key);
    if (!$plan_id) break;

    upsert_subscription($pdo, $buwana_id, $plan_id, $subscription_id, $period_end);
    break;


/* ✅ 3. Subscription Canceled */
case "customer.subscription.deleted":
    $sub             = $data;
    $subscription_id = $sub["id"];
    $customer        = $sub["customer"];

    $buwana_id = find_user_by_customer($pdo, $customer);
    if (!$buwana_id) break;

    $stmt = $pdo->prepare("
        UPDATE user_subscriptions_tb
        SET status='canceled', canceled_at = NOW(), updated_at=NOW()
        WHERE user_id = :uid AND external_subscription_id = :sid
    ");
    $stmt->execute([
        "uid" => $buwana_id,
        "sid" => $subscription_id
    ]);
    break;
}


http_response_code(200);
echo json_encode(["received" => true]);
