
<?php
// backend_api/categories.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
require_once 'database.php';

try {
    $sql = "SELECT id, category_name, category_code, description, icon_url, sort_order, is_active, created_at
                           FROM product_categories
                           WHERE is_active = 1
                           ORDER BY sort_order ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $categories = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $categories
    ], JSON_UNESCAPED_UNICODE);
    
}  catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>