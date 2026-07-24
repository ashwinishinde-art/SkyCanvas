<?php
require_once __DIR__ . '/db.php';
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Invalid request method.'], 405);
}

$body = read_json_body();
$city = trim($body['city_name'] ?? '');
$country = trim($body['country'] ?? '');
$lat = $body['latitude'] ?? null;
$lon = $body['longitude'] ?? null;

if ($city === '' || $lat === null || $lon === null) {
    json_response(['success' => false, 'message' => 'City name and coordinates are required.'], 422);
}

$pdo = get_pdo();
$stmt = $pdo->prepare(
    'INSERT INTO favorite_cities (user_id, city_name, country, latitude, longitude)
     VALUES (:uid, :city, :country, :lat, :lon)
     ON DUPLICATE KEY UPDATE country = VALUES(country), latitude = VALUES(latitude), longitude = VALUES(longitude)'
);
$stmt->execute([
    'uid' => $user['id'],
    'city' => $city,
    'country' => $country,
    'lat' => $lat,
    'lon' => $lon,
]);

json_response(['success' => true, 'message' => 'City saved to favorites.']);
