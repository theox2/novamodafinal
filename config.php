<?php
/**
 * config.php - Configuração do Banco de Dados
 * COLOQUE NA RAIZ: /Novamoda/config.php
 */

// ATIVAR ERROS (apenas desenvolvimento)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configurações do banco
define('DB_HOST', 'localhost');
define('DB_NAME', 'novamoda');
define('DB_USER', 'root');
define('DB_PASS', ''); // Sua senha do MySQL (se tiver)
define('DB_CHARSET', 'utf8mb4');

// CORS - PERMITIR REQUESTS DO FRONTEND
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responder preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexão PDO
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // Teste básico
    $pdo->query("SELECT 1");
    
} catch(PDOException $e) {
    // Retornar erro em JSON
    http_response_code(500);
    die(json_encode([
        'error' => true,
        'message' => 'Erro de conexão com o banco de dados',
        'details' => $e->getMessage(),
        'host' => DB_HOST,
        'database' => DB_NAME
    ]));
}
?>