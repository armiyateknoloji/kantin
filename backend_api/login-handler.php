<?php
// backend_api/login-handler.php - Kullanıcı giriş işlemleri (Debug Versiyonu)

// Hata raporlamayı aç (geliştirme aşamasında)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Session başlat
session_start();

// Veritabanı bağlantısı
require_once 'database.php';

// CORS ayarları
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

try {
    // Sadece POST isteklerini kabul et
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Geçersiz istek metodu!');
    }

    // ✅ DEBUG: Gelen veriyi logla
    error_log("POST Data: " . print_r($_POST, true));
    
    // ✅ FORM VERİLERİNİ AL
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember_me = isset($_POST['remember_me']) ? true : false;

    // ✅ DEBUG: Değişkenleri logla
    error_log("Email: '$email', Password length: " . strlen($password) . ", Remember: " . ($remember_me ? 'true' : 'false'));

    // ✅ VERİ DOĞRULAMA
    $errors = [];

    if (empty($email)) {
        $errors[] = 'Email alanı zorunludur!';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Geçerli bir email adresi giriniz!';
    }

    if (empty($password)) {
        $errors[] = 'Şifre alanı zorunludur!';
    }

    // ✅ DEBUG: Hataları logla
    if (!empty($errors)) {
        error_log("Validation errors: " . implode(', ', $errors));
        echo json_encode([
            'success' => false,
            'message' => 'Lütfen aşağıdaki hataları düzeltiniz:',
            'errors' => $errors,
            'debug_info' => [
                'received_email' => $email,
                'received_password_length' => strlen($password),
                'post_data' => $_POST
            ]
        ]);
        exit;
    }

    // ✅ KULLANICI VERİTABANINDA VAR MI?
    $stmt = $pdo->prepare("
        SELECT 
            id, username, email, password_hash, first_name, last_name, 
            is_active, email_verified, login_attempts, locked_until, 
            company_id, department_id, role_name
        FROM users 
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // ✅ DEBUG: Kullanıcı sorgusu sonucu
    error_log("User query result: " . ($user ? "Found user ID: {$user['id']}" : "User not found"));

    // ✅ KULLANICI BULUNAMADI
    if (!$user) {
        // Güvenlik için biraz gecikme ekle
        usleep(500000); // 0.5 saniye
        
        echo json_encode([
            'success' => false,
            'message' => 'Email adresi veya şifre hatalı! Kayıt olmadıysanız önce kayıt olunuz.',
            'register_suggestion' => true
        ]);
        exit;
    }

    // ✅ HESAP KİLİTLİ Mİ?
    if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
        $lock_remaining = ceil((strtotime($user['locked_until']) - time()) / 60);
        echo json_encode([
            'success' => false,
            'message' => "Hesabınız {$lock_remaining} dakika kilitli. Çok fazla başarısız giriş denemesi yaptınız.",
            'locked' => true
        ]);
        exit;
    }

    // ✅ HESAP AKTİF Mİ?
    if (!$user['is_active']) {
        echo json_encode([
            'success' => false,
            'message' => 'Hesabınız devre dışı bırakılmış. Lütfen yönetici ile iletişime geçiniz.',
            'inactive' => true
        ]);
        exit;
    }

    // ✅ ŞİFRE DOĞRULAMA
    error_log("Password verification for user {$user['id']}");
    if (!password_verify($password, $user['password_hash'])) {
        // Başarısız giriş denemesini artır
        $new_attempts = $user['login_attempts'] + 1;
        
        error_log("Password verification failed. Attempts: $new_attempts");
        
        // 5 başarısız denemeden sonra 15 dakika kilitle
        if ($new_attempts >= 5) {
            $lock_time = date('Y-m-d H:i:s', time() + (15 * 60)); // 15 dakika
            $stmt = $pdo->prepare("UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?");
            $stmt->execute([$new_attempts, $lock_time, $user['id']]);
            
            echo json_encode([
                'success' => false,
                'message' => 'Çok fazla başarısız deneme! Hesabınız 15 dakika kilitlendi.',
                'locked' => true
            ]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET login_attempts = ? WHERE id = ?");
            $stmt->execute([$new_attempts, $user['id']]);
            
            $remaining = 5 - $new_attempts;
            echo json_encode([
                'success' => false,
                'message' => "Email adresi veya şifre hatalı! {$remaining} deneme hakkınız kaldı.",
                'attempts_remaining' => $remaining
            ]);
        }
        exit;
    }

    // ✅ GİRİŞ BAŞARILI!
      error_log("Login successful for user {$user['id']} with role {$user['role_name']}");
    
    // Login attempts ve lock'u sıfırla
    $stmt = $pdo->prepare("UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);

    // ✅ SESSION'A KAYDET
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['company_id'] = $user['company_id'];
    $_SESSION['department_id'] = $user['department_id'];
    $_SESSION['role_name'] = $user['role_name'];
    $_SESSION['logged_in'] = true;
    $_SESSION['login_time'] = time();

    // ✅ "BENİ HATIRLA" COOKIE'Sİ
    if ($remember_me) {
        // Güvenli remember token oluştur
        $remember_token = bin2hex(random_bytes(32));
        $remember_expires = date('Y-m-d H:i:s', time() + (30 * 24 * 60 * 60)); // 30 gün
        
        // Token'ı veritabanına kaydet
        $stmt = $pdo->prepare("UPDATE users SET remember_token = ?, remember_expires = ? WHERE id = ?");
        $stmt->execute([$remember_token, $remember_expires, $user['id']]);
        
        // Cookie ayarla (30 gün)
        setcookie('remember_token', $remember_token, time() + (30 * 24 * 60 * 60), '/', '', false, true);
        setcookie('remember_user', $user['id'], time() + (30 * 24 * 60 * 60), '/', '', false, true);
    }

    // ✅ BAŞARILI RESPONSE
    echo json_encode([
        'success' => true,
        'message' => 'Giriş başarılı! Hoş geldin ' . $user['first_name'] . '!',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role_name']
        ],
        'redirect' => '../kantin/index.html'
    ]);

    // ✅ LOG KAYDI
    error_log("Başarılı giriş: {$user['username']} ({$user['email']}) - IP: " . $_SERVER['REMOTE_ADDR']);

} catch (PDOException $e) {
    error_log("Database Error in login-handler.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Sistem hatası! Lütfen daha sonra tekrar deneyiniz.',
        'debug_error' => $e->getMessage()
    ]);

} catch (Exception $e) {
    error_log("General Error in login-handler.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug_error' => $e->getMessage()
    ]);
}
?>