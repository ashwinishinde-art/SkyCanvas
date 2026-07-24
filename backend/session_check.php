<?php
session_start();
header('Content-Type: application/json');

if (!empty($_SESSION['user_id'])) {
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'username' => $_SESSION['username'],
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => true, 'authenticated' => false]);
}
