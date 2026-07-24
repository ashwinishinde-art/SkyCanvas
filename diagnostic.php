<?php
/**
 * Skylight Farm - Registration Diagnostic Script
 * Run this at: http://localhost/xampp/htdocs/skycanvas/diagnostic.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Skylight Farm - Diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .check { margin: 15px 0; padding: 15px; border-left: 4px solid #ddd; background: #fafafa; }
        .pass { border-left-color: #10b981; background: #ecfdf5; }
        .fail { border-left-color: #ef4444; background: #fef2f2; }
        .warn { border-left-color: #f59e0b; background: #fffbeb; }
        .label { font-weight: bold; margin-bottom: 5px; }
        .status { padding: 5px 10px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 12px; }
        .status.ok { background: #d1fae5; color: #065f46; }
        .status.error { background: #fee2e2; color: #991b1b; }
        .status.warn { background: #fef3c7; color: #92400e; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table th, table td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
        table th { background: #f0f0f0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Skylight Farm - Diagnostic Report</h1>
        <p>This script checks your setup for common registration issues.</p>

        <?php
        $checks = [];
        $all_pass = true;

        // Check 1: PHP Version
        echo '<div class="check ' . (PHP_VERSION_ID >= 70400 ? 'pass' : 'fail') . '">';
        echo '<div class="label">PHP Version</div>';
        echo '<span class="status ' . (PHP_VERSION_ID >= 70400 ? 'ok' : 'error') . '">' . (PHP_VERSION_ID >= 70400 ? 'OK' : 'ERROR') . '</span>';
        echo '<p>Version: <code>' . phpversion() . '</code> (Required: 7.4+)</p>';
        if (PHP_VERSION_ID < 70400) $all_pass = false;
        echo '</div>';

        // Check 2: PDO MySQL Extension
        $pdo_ok = extension_loaded('pdo') && extension_loaded('pdo_mysql');
        echo '<div class="check ' . ($pdo_ok ? 'pass' : 'fail') . '">';
        echo '<div class="label">PDO MySQL Extension</div>';
        echo '<span class="status ' . ($pdo_ok ? 'ok' : 'error') . '">' . ($pdo_ok ? 'OK' : 'ERROR') . '</span>';
        echo '<p>' . ($pdo_ok ? 'PDO and PDO MySQL are loaded.' : 'Missing PDO or PDO MySQL extension!') . '</p>';
        if (!$pdo_ok) $all_pass = false;
        echo '</div>';

        // Check 3: Session Support
        $session_ok = ini_get('session.save_handler');
        echo '<div class="check ' . ($session_ok ? 'pass' : 'fail') . '">';
        echo '<div class="label">Session Support</div>';
        echo '<span class="status ' . ($session_ok ? 'ok' : 'error') . '">' . ($session_ok ? 'OK' : 'ERROR') . '</span>';
        echo '<p>Session handler: <code>' . htmlspecialchars($session_ok) . '</code></p>';
        if (!$session_ok) $all_pass = false;
        echo '</div>';

        // Check 4: Database Connection
        require_once __DIR__ . '/backend/config.php';
        $db_ok = false;
        $db_error = '';
        
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
            $db_ok = true;
        } catch (PDOException $e) {
            $db_error = $e->getMessage();
            $all_pass = false;
        }

        echo '<div class="check ' . ($db_ok ? 'pass' : 'fail') . '">';
        echo '<div class="label">Database Connection</div>';
        echo '<span class="status ' . ($db_ok ? 'ok' : 'error') . '">' . ($db_ok ? 'OK' : 'ERROR') . '</span>';
        if ($db_ok) {
            echo '<p>✓ Connected to <code>' . DB_NAME . '</code> on <code>' . DB_HOST . '</code></p>';
        } else {
            echo '<p><strong>Connection Failed:</strong> <code>' . htmlspecialchars($db_error) . '</code></p>';
        }
        echo '</div>';

        // Check 5: users Table Exists
        if ($db_ok) {
            try {
                $result = $pdo->query("SHOW TABLES LIKE 'users'");
                $table_exists = $result && $result->rowCount() > 0;
            } catch (Exception $e) {
                $table_exists = false;
            }

            echo '<div class="check ' . ($table_exists ? 'pass' : 'fail') . '">';
            echo '<div class="label">users Table</div>';
            echo '<span class="status ' . ($table_exists ? 'ok' : 'error') . '">' . ($table_exists ? 'OK' : 'ERROR') . '</span>';
            if ($table_exists) {
                echo '<p>✓ Table exists</p>';
                
                // Check required columns
                try {
                    $result = $pdo->query("DESCRIBE users");
                    $columns = $result->fetchAll(PDO::FETCH_COLUMN, 0);
                    $required = ['id', 'username', 'email', 'password_hash'];
                    $missing = array_diff($required, $columns);
                    
                    if (empty($missing)) {
                        echo '<p>✓ All required columns present</p>';
                        echo '<table><tr><th>Column</th><th>Type</th></tr>';
                        $result = $pdo->query("DESCRIBE users");
                        foreach ($result->fetchAll() as $col) {
                            echo '<tr><td><code>' . htmlspecialchars($col['Field']) . '</code></td><td><code>' . htmlspecialchars($col['Type']) . '</code></td></tr>';
                        }
                        echo '</table>';
                    } else {
                        echo '<p><strong>Missing columns:</strong> ' . implode(', ', array_map(function($c) { return '<code>' . htmlspecialchars($c) . '</code>'; }, $missing)) . '</p>';
                        $all_pass = false;
                    }
                } catch (Exception $e) {
                    echo '<p><strong>Error checking columns:</strong> ' . htmlspecialchars($e->getMessage()) . '</p>';
                }
            } else {
                echo '<p><strong>✗ Table does not exist!</strong> Import schema.sql</p>';
                $all_pass = false;
            }
            echo '</div>';

            // Check 6: Other Tables
            $other_tables = ['favorite_cities', 'search_history'];
            foreach ($other_tables as $table) {
                try {
                    $result = $pdo->query("SHOW TABLES LIKE '$table'");
                    $exists = $result && $result->rowCount() > 0;
                } catch (Exception $e) {
                    $exists = false;
                }

                echo '<div class="check ' . ($exists ? 'pass' : 'fail') . '">';
                echo '<div class="label">' . ucfirst(str_replace('_', ' ', $table)) . ' Table</div>';
                echo '<span class="status ' . ($exists ? 'ok' : 'error') . '">' . ($exists ? 'OK' : 'ERROR') . '</span>';
                echo '<p>' . ($exists ? '✓ Table exists' : '✗ Table missing') . '</p>';
                echo '</div>';

                if (!$exists) $all_pass = false;
            }

            // Check 7: Sample Data
            try {
                $result = $pdo->query("SELECT COUNT(*) as count FROM users");
                $count = $result->fetch()['count'];
                echo '<div class="check">';
                echo '<div class="label">Database Contents</div>';
                echo '<p>Users in database: <code>' . $count . '</code></p>';
                if ($count > 0) {
                    echo '<p><strong>Existing accounts:</strong></p>';
                    echo '<table><tr><th>ID</th><th>Username</th><th>Email</th><th>Created</th></tr>';
                    $result = $pdo->query("SELECT id, username, email, created_at FROM users LIMIT 10");
                    foreach ($result->fetchAll() as $user) {
                        echo '<tr>';
                        echo '<td>' . htmlspecialchars($user['id']) . '</td>';
                        echo '<td><code>' . htmlspecialchars($user['username']) . '</code></td>';
                        echo '<td><code>' . htmlspecialchars($user['email']) . '</code></td>';
                        echo '<td>' . htmlspecialchars($user['created_at']) . '</td>';
                        echo '</tr>';
                    }
                    echo '</table>';
                }
                echo '</div>';
            } catch (Exception $e) {
                echo '<div class="check fail">';
                echo '<div class="label">Database Contents</div>';
                echo '<span class="status error">ERROR</span>';
                echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
                echo '</div>';
            }
        }

        // Summary
        echo '<div class="check ' . ($all_pass ? 'pass' : 'fail') . '" style="margin-top: 30px;">';
        echo '<div class="label" style="font-size: 18px;">Summary</div>';
        if ($all_pass) {
            echo '<span class="status ok">ALL CHECKS PASSED</span>';
            echo '<p style="color: #065f46; margin-top: 10px;">✓ Your setup appears to be working correctly!</p>';
            echo '<p>Try registering at: <a href="register.html" style="color: #1e40af;">register.html</a></p>';
        } else {
            echo '<span class="status error">ISSUES FOUND</span>';
            echo '<p style="color: #991b1b; margin-top: 10px;">✗ Please fix the errors above before trying to register.</p>';
            echo '<p>See <strong>REGISTRATION_TROUBLESHOOTING.md</strong> for help.</p>';
        }
        echo '</div>';
        ?>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p><strong>Configuration:</strong></p>
            <ul>
                <li>Database: <code><?php echo htmlspecialchars(DB_NAME); ?></code></li>
                <li>Host: <code><?php echo htmlspecialchars(DB_HOST); ?></code></li>
                <li>User: <code><?php echo htmlspecialchars(DB_USER); ?></code></li>
                <li>Generated: <?php echo date('Y-m-d H:i:s'); ?></li>
            </ul>
        </div>
    </div>
</body>
</html>
