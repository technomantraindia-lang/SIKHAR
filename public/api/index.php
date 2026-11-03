<?php
// High-Performance UNIX Socket Proxy for Sikhar Fleet Node.js Backend
error_reporting(0);

$socketPath = '/home/u312917867/sikhar-app.sock';

if (!file_exists($socketPath)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Backend service is starting up. Please retry in a few seconds.',
        'socket' => $socketPath
    ]);
    exit;
}

$client = @stream_socket_client("unix://" . $socketPath, $errno, $errstr, 5);
if (!$client) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Could not connect to backend gateway: ' . $errstr
    ]);
    exit;
}

// Build request to Node.js
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$protocol = $_SERVER['SERVER_PROTOCOL'] ?? 'HTTP/1.1';

$body = file_get_contents('php://input');

$headers = [];
$headers[] = "$method $uri $protocol";
$headers[] = "Host: " . ($_SERVER['HTTP_HOST'] ?? 'localhost');

foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host' && strtolower($name) !== 'content-length') {
        $headers[] = "$name: $value";
    }
}
$headers[] = "Content-Length: " . strlen($body);
$headers[] = "Connection: close";

$requestData = implode("\r\n", $headers) . "\r\n\r\n" . $body;
fwrite($client, $requestData);

// Read response from Node.js
$rawResponse = stream_get_contents($client);
fclose($client);

if (!$rawResponse) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Empty response from backend service.']);
    exit;
}

// Separate response headers and body
$parts = explode("\r\n\r\n", $rawResponse, 2);
$headerPart = $parts[0] ?? '';
$bodyPart = $parts[1] ?? '';

$headerLines = explode("\r\n", $headerPart);
$statusLine = array_shift($headerLines);

if (preg_match('/HTTP\/[0-9\.]+\s+([0-9]+)/', $statusLine, $matches)) {
    http_response_code((int)$matches[1]);
}

foreach ($headerLines as $header) {
    if (!empty($header) && stripos($header, 'Transfer-Encoding') === false && stripos($header, 'Connection') === false) {
        header($header, false);
    }
}

echo $bodyPart;

