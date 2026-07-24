<?php
require_once __DIR__ . '/db.php';
$user = require_login();

$pdo = get_pdo();
$stmt = $pdo->prepare('SELECT id, city_name, country, latitude, longitude FROM favorite_cities WHERE user_id = :uid ORDER BY created_at DESC');
$stmt->execute(['uid' => $user['id']]);

json_response(['success' => true, 'favorites' => $stmt->fetchAll()]);
