<?php
require_once __DIR__ . '/db.php';
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Invalid request method.'], 405);
}

$body = read_json_body();
$id = (int) ($body['id'] ?? 0);

if ($id <= 0) {
    json_response(['success' => false, 'message' => 'Missing favorite id.'], 422);
}

$pdo = get_pdo();
$stmt = $pdo->prepare('DELETE FROM favorite_cities WHERE id = :id AND user_id = :uid');
$stmt->execute(['id' => $id, 'uid' => $user['id']]);

json_response(['success' => true, 'message' => 'Removed from favorites.']);
