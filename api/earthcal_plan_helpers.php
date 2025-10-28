<?php
declare(strict_types=1);

if (!function_exists('earthcal_normalize_plan')) {
    function earthcal_normalize_plan(array $row): array
    {
        return [
            'plan_id'          => isset($row['plan_id']) ? (int)$row['plan_id'] : null,
            'name'             => $row['name'] ?? null,
            'slug'             => $row['slug'] ?? null,
            'description'      => $row['description'] ?? null,
            'price_cents'      => isset($row['price_cents']) ? (int)$row['price_cents'] : 0,
            'currency'         => $row['currency'] ?? 'USD',
            'billing_interval' => $row['billing_interval'] ?? 'month',
            'duration_days'    => array_key_exists('duration_days', $row)
                ? ($row['duration_days'] === null ? null : (int)$row['duration_days'])
                : null,
            'is_active'        => isset($row['is_active']) ? ((int)$row['is_active'] === 1) : true,
            'created_at'       => $row['created_at'] ?? null,
            'updated_at'       => $row['updated_at'] ?? null,
        ];
    }
}

if (!function_exists('earthcal_fetch_active_plans')) {
    /**
     * @return array<int, array<string, mixed>>
     */
    function earthcal_fetch_active_plans(PDO $pdo): array
    {
        $stmt = $pdo->prepare(
            "SELECT plan_id, name, slug, description, price_cents, currency, billing_interval, duration_days, is_active, created_at, updated_at\n"
            . "  FROM plans_tb\n"
            . " WHERE is_active = 1\n"
            . " ORDER BY price_cents ASC, plan_id ASC"
        );
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map('earthcal_normalize_plan', $rows);
    }
}
