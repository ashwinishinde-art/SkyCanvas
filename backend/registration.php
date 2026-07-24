<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    session_start();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['success' => false, 'message' => 'Invalid request method.'], 405);
    }

    $body = read_json_body();
    $username = trim($body['username'] ?? '');
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $password_confirm = $body['password_confirm'] ?? '';

    // Validate all fields present
    if ($username === '' || $email === '' || $password === '' || $password_confirm === '') {
        json_response(['success' => false, 'message' => 'All fields are required.'], 422);
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['success' => false, 'message' => 'Enter a valid email address.'], 422);
    }

    // Validate password length
    if (strlen($password) < 8) {
        json_response(['success' => false, 'message' => 'Password must be at least 8 characters.'], 422);
    }

    // Validate passwords match
    if ($password !== $password_confirm) {
        json_response(['success' => false, 'message' => 'Passwords do not match.'], 422);
    }

    // Validate username format
    if (!preg_match('/^[a-zA-Z0-9_.]{3,50}$/', $username)) {
        json_response(['success' => false, 'message' => 'Username must be 3-50 characters and contain only letters, numbers, dots, or underscores.'], 422);
    }

    // Get database connection
    $pdo = get_pdo();

    // Check if username or email already exists
    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1');
    $check->execute(['email' => $email, 'username' => $username]);
    
    if ($check->fetch()) {
        json_response(['success' => false, 'message' => 'An account with that username or email already exists.'], 409);
    }

    // Hash password and insert user
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $insert = $pdo->prepare('INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :hash)');
    $insert->execute(['username' => $username, 'email' => $email, 'hash' => $hash]);

    $user_id = (int) $pdo->lastInsertId();
    
    if (!$user_id) {
        json_response(['success' => false, 'message' => 'Failed to create account.'], 500);
    }

    // Set session
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;

    json_response(['success' => true, 'message' => 'Account created successfully. Redirecting...', 'username' => $username]);

} catch (PDOException $e) {
    error_log("PDOException in registration.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database error. Please try again later.',
        'debug' => 'PDO Error: ' . $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Exception in register.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'An error occurred. Please try again.',
        'debug' => 'Error: ' . $e->getMessage()
    ]);
    exit;
}
