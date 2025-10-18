<?php
declare(strict_types=1);

if (!function_exists('earthcal_get_pdo')) {
    require_once __DIR__ . '/calconn_env.php';

    /**
     * Return a shared PDO instance configured from calconn_env.php.
     *
     * The environment file may either expose a ready-to-use $pdo handle or the
     * discrete credential variables used across legacy scripts. This helper
     * normalises those shapes so the API endpoints can consistently obtain a
     * connection while still respecting any connection attributes defined by
     * the environment bootstrap.
     */
    function earthcal_get_pdo(): PDO
    {
        static $cached = null;

        if ($cached instanceof PDO) {
            return $cached;
        }

        if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
            $cached = $GLOBALS['pdo'];
            return $cached;
        }

        $host = $GLOBALS['cal_servername'] ?? $GLOBALS['host'] ?? null;
        $port = $GLOBALS['cal_port'] ?? $GLOBALS['port'] ?? null;
        $db   = $GLOBALS['cal_dbname'] ?? $GLOBALS['db'] ?? null;
        $user = $GLOBALS['cal_username'] ?? $GLOBALS['user'] ?? null;
        $pass = $GLOBALS['cal_password'] ?? $GLOBALS['pass'] ?? null;

        if ($db === null || $user === null || $pass === null) {
            throw new RuntimeException('Database credentials missing in calconn_env.php');
        }

        $host = $host ?: '127.0.0.1';
        $port = $port ?: 3306;
        $dsn  = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

        $cached = new PDO($dsn, (string)$user, (string)$pass, [
             PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
             PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
             PDO::ATTR_EMULATE_PREPARES   => true,
             PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4',
         ]);

        $cached->exec("SET time_zone = '+00:00'");

        error_log('EarthCal PDO created at: ' . (__FILE__) . ' emulate_prepares=' .
                  var_export($cached->getAttribute(PDO::ATTR_EMULATE_PREPARES), true));


        return $cached;
    }
}
