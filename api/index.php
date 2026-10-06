<?php
declare(strict_types=1);

function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function normalize_email_or_national_id(string $value): ?string
{
    $identifier = trim($value);
    $identifier = strtr($identifier, [
        '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
        '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
        '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
    ]);
    if (preg_match('/^[0-9]{10}$/D', $identifier) === 1) return $identifier;
    if (filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false) return strtolower($identifier);
    return null;
}

function unauthorized(): never
{
    respond(401, ['error' => 'unauthorized']);
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    respond(500, ['error' => 'server_error']);
}

$config = require $configPath;
if (!is_array($config)) {
    respond(500, ['error' => 'server_error']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config['allowed_origins'] ?? [];
if (!is_array($allowedOrigins)) {
    respond(500, ['error' => 'server_error']);
}

header('Vary: Origin');
if ($origin !== '') {
    if (!in_array($origin, $allowedOrigins, true)) {
        respond(403, ['error' => 'invalid']);
    }
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'invalid']);
}

$action = $_GET['action'] ?? '';
if ($action === 'register') {
    respond(403, ['error' => 'registration_closed']);
}

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody === false ? '' : $rawBody, true);
if (!is_array($body)) {
    respond(400, ['error' => 'invalid']);
}

$tokenSecret = (string)($config['token_secret'] ?? '');
if (strlen($tokenSecret) < 32 || str_starts_with($tokenSecret, 'REPLACE_WITH_')) {
    respond(500, ['error' => 'server_error']);
}

$schoolTable = (string)($config['school_table'] ?? 'schools');
$schoolCodeColumn = (string)($config['school_code_column'] ?? 'code');
if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $schoolTable)
    || !preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $schoolCodeColumn)) {
    respond(500, ['error' => 'server_error']);
}

try {
    $pdo = new PDO(
        (string)($config['db_dsn'] ?? ''),
        (string)($config['db_username'] ?? ''),
        (string)($config['db_password'] ?? ''),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    if (in_array($action, ['school-data', 'record-save', 'record-delete', 'user-create', 'user-delete'], true)) {
        require_once __DIR__ . '/data_endpoints.php';
        handle_data_action($pdo, $config, $action, $body);
    }

    if ($action === 'login') {
        $email = normalize_email_or_national_id((string)($body['email'] ?? $body['identifier'] ?? ''));
        $password = (string)($body['password'] ?? '');
        if ($email === null || strlen($email) > 254 || $password === '') {
            respond(400, ['error' => 'invalid']);
        }

        $userStatement = $pdo->prepare(
            'SELECT id, email, password_hash FROM users WHERE email = :email LIMIT 1'
        );
        $userStatement->execute(['email' => $email]);
        $user = $userStatement->fetch();
        if (!$user || !password_verify($password, (string)$user['password_hash'])) {
            respond(401, ['error' => 'bad_credentials']);
        }

        $issuedAt = time();
        $ttl = max(300, min(2592000, (int)($config['token_ttl_seconds'] ?? 43200)));
        $payload = base64url_encode((string)json_encode([
            'sub' => (string)$user['id'],
            'iat' => $issuedAt,
            'exp' => $issuedAt + $ttl,
            'nonce' => bin2hex(random_bytes(16)),
        ], JSON_UNESCAPED_SLASHES));
        $signature = base64url_encode(hash_hmac('sha256', $payload, $tokenSecret, true));

        respond(200, ['token' => $payload . '.' . $signature]);
    }

    if ($action === 'me') {
        $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer\s+([A-Za-z0-9_.-]+)$/i', $authorization, $matches)) {
            unauthorized();
        }

        $parts = explode('.', $matches[1]);
        if (count($parts) !== 2) {
            unauthorized();
        }

        [$payload, $providedSignature] = $parts;
        $expectedSignature = base64url_encode(hash_hmac('sha256', $payload, $tokenSecret, true));
        if (!hash_equals($expectedSignature, $providedSignature)) {
            unauthorized();
        }

        $normalizedPayload = strtr($payload, '-_', '+/');
        $normalizedPayload .= str_repeat('=', (4 - strlen($normalizedPayload) % 4) % 4);
        $payloadJson = base64_decode($normalizedPayload, true);
        $claims = $payloadJson === false ? null : json_decode($payloadJson, true);
        if (!is_array($claims)
            || !isset($claims['sub'], $claims['exp'])
            || !is_string($claims['sub'])
            || !is_numeric($claims['sub'])
            || !is_numeric($claims['exp'])
            || (int)$claims['exp'] <= time()) {
            unauthorized();
        }

        $userStatement = $pdo->prepare(
            'SELECT id, email, role, school_id FROM users WHERE id = :id LIMIT 1'
        );
        $userStatement->execute(['id' => $claims['sub']]);
        $user = $userStatement->fetch();
        if (!$user) {
            unauthorized();
        }

        respond(200, [
            'id' => (string)$user['id'],
            'email' => (string)$user['email'],
            'role' => (string)$user['role'],
            'school_id' => (string)$user['school_id'],
        ]);
    }

    respond(400, ['error' => 'invalid']);
} catch (PDOException $error) {
    if (in_array($action, ['register', 'user-create'], true) && $error->getCode() === '23000') {
        respond(409, ['error' => 'exists']);
    }
    error_log('Authentication API database failure: ' . $error->getMessage());
    respond(500, ['error' => 'server_error']);
} catch (Throwable $error) {
    error_log('Authentication API failure: ' . $error->getMessage());
    respond(500, ['error' => 'server_error']);
}