<?php
// api/products.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST, OPTIONS');
require_once 'database.php';

$category_id = $_GET['categories_id'] ?? $_GET['category_id'] ?? null;

if (!$category_id) {
    echo json_encode(['success' => false, 'error' => 'Kategori ID gerekli']);
    exit;
}

try {
    // Ürünleri getir
     $sql = "SELECT 
                id,
                category_id,
                product_name,
                product_code,
                description,
                image_url,
                unit_price as price,
                is_active,
                is_featured,
                sort_order,
                created_at,
                updated_at
            FROM products 
            WHERE category_id = :category_id 
            AND is_active = 1 
            ORDER BY sort_order ASC, product_name ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fiyat formatını düzelt (decimal'dan string'e çevir)
    foreach($products as &$product) {
        $product['price'] = number_format($product['price'], 2, '.', '');
        $product['is_featured'] = (int)$product['is_featured'];
        $product['is_active'] = (int)$product['is_active'];
    }
    
     echo json_encode([
        'success' => true, 
        'data' => $products,
        'debug' => [
            'category_id' => $category_id,
            'product_count' => count($products),
            'query' => $sql
        ]
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'debug' => [
            'category_id' => $category_id,
            'sql' => $sql
        ]
    ]);
}
?>