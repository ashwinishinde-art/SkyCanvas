<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    session_start();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['success' => false, 'message' => 'Invalid request method.'], 405);
    }

    $body = read_json_body();
    $identifier = trim($body['identifier'] ?? '');
    $password = $body['password'] ?? '';

    if ($identifier === '' || $password === '') {
        json_response(['success' => false, 'message' => 'Enter your username/email and password.'], 422);
    }

    $pdo = get_pdo();
    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE email = :id OR username = :id LIMIT 1');
    $stmt->execute(['id' => $identifier]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_response(['success' => false, 'message' => 'Incorrect username/email or password.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['username'] = $user['username'];

    json_response(['success' => true, 'message' => 'Welcome back. Redirecting...', 'username' => $user['username']]);
    
} catch (PDOException $e) {
    error_log("PDOException in login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database error. Please try again later.',
        'debug' => 'PDO Error: ' . $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Exception in login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'An error occurred. Please try again.',
        'debug' => 'Error: ' . $e->getMessage()
    ]);
    exit;
}
