<?php
// backend_api/register-handler.php - Kullanıcı kayıt işlemleri

// Hata raporlamayı aç (geliştirme aşamasında)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Session başlat
session_start();

// Veritabanı bağlantısı
require_once 'database.php';

// CORS ayarları (frontend için)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

try {
    // Sadece POST isteklerini kabul et
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Geçersiz istek metodu!');
    }

    // ✅ FORM VERİLERİNİ AL VE DOĞRULA
    $first_name = trim($_POST['first_name'] ?? '');
    $last_name = trim($_POST['last_name'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $phone = trim($_POST['phone'] ?? '');

    // ✅ VERİ DOĞRULAMA
    $errors = [];

    // İsim kontrolü
    if (empty($first_name)) {
        $errors[] = 'İsim alanı zorunludur!';
    } elseif (strlen($first_name) < 2) {
        $errors[] = 'İsim en az 2 karakter olmalıdır!';
    } elseif (strlen($first_name) > 50) {
        $errors[] = 'İsim en fazla 50 karakter olabilir!';
    }

    // Soyisim kontrolü
    if (empty($last_name)) {
        $errors[] = 'Soyisim alanı zorunludur!';
    } elseif (strlen($last_name) < 2) {
        $errors[] = 'Soyisim en az 2 karakter olmalıdır!';
    } elseif (strlen($last_name) > 50) {
        $errors[] = 'Soyisim en fazla 50 karakter olabilir!';
    }

    // Kullanıcı adı kontrolü
    if (empty($username)) {
        $errors[] = 'Kullanıcı adı zorunludur!';
    } elseif (strlen($username) < 3) {
        $errors[] = 'Kullanıcı adı en az 3 karakter olmalıdır!';
    } elseif (strlen($username) > 50) {
        $errors[] = 'Kullanıcı adı en fazla 50 karakter olabilir!';
    } elseif (!preg_match('/^[a-zA-Z0-9_.-]+$/', $username)) {
        $errors[] = 'Kullanıcı adı sadece harf, rakam, _, . ve - içerebilir!';
    }

    // Email kontrolü
    if (empty($email)) {
        $errors[] = 'Email alanı zorunludur!';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Geçerli bir email adresi giriniz!';
    } elseif (strlen($email) > 255) {
        $errors[] = 'Email adresi çok uzun!';
    }

    // Şifre kontrolü
    if (empty($password)) {
        $errors[] = 'Şifre alanı zorunludur!';
    } elseif (strlen($password) < 6) {
        $errors[] = 'Şifre en az 6 karakter olmalıdır!';
    } elseif (strlen($password) > 255) {
        $errors[] = 'Şifre çok uzun!';
    }

    // Telefon kontrolü (opsiyonel)
    if (!empty($phone)) {
        // Türkiye telefon formatı kontrolü
        $phone_pattern = '/^(\+90|0)?5[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/';
        if (!preg_match($phone_pattern, $phone)) {
            $errors[] = 'Geçerli bir telefon numarası giriniz! (+90 5xx xxx xx xx)';
        }
        // Telefonu standart formata çevir
        $phone = preg_replace('/[^\d]/', '', $phone);
        if (strlen($phone) == 11 && substr($phone, 0, 1) == '0') {
            $phone = '90' . substr($phone, 1);
        }
    }

    // Hata varsa döndür
    if (!empty($errors)) {
        echo json_encode([
            'success' => false,
            'message' => 'Lütfen aşağıdaki hataları düzeltiniz:',
            'errors' => $errors
        ]);
        exit;
    }

    // ✅ VERİTABANI KONTROLLERI
    
    // Email kontrolü
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Bu email adresi zaten kullanılmaktadır!'
        ]);
        exit;
    }

    // Kullanıcı adı kontrolü
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Bu kullanıcı adı zaten alınmıştır!'
        ]);
        exit;
    }

    // ✅ ŞİFREYİ HASH'LE
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // ✅ KULLANICIYI VERİTABANINA KAYDET
    $stmt = $pdo->prepare("
        INSERT INTO users (
            company_id,
            department_id, 
            role_id,
            username, 
            email, 
            password_hash, 
            first_name,
            last_name,
            phone, 
            is_active,
            email_verified,
            login_attempts,
            daily_order_limit,
            monthly_order_limit,
            notification_preferences,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $result = $stmt->execute([
        1,  // Default company_id (ayarlayabilirsiniz)
        1,  // Default department_id (ayarlayabilirsiniz)
        3,  // Default role_id (3 = normal kullanıcı olabilir)
        $username,
        $email,
        $password_hash,
        $first_name,
        $last_name,
        $phone ?: null,
        1,  // is_active = true
        0,  // email_verified = false (doğrulama sistemi eklenebilir)
        0,  // login_attempts = 0
        100.00,  // Default daily_order_limit
        3000.00, // Default monthly_order_limit
        json_encode(['email' => true, 'sms' => false]) // Default notification preferences
    ]);

    if ($result) {
        $user_id = $pdo->lastInsertId();
        
        // ✅ SESSION'A KAYDET (otomatik giriş)
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        $_SESSION['first_name'] = $first_name;
        $_SESSION['last_name'] = $last_name;
        $_SESSION['email'] = $email;
        $_SESSION['logged_in'] = true;

        // ✅ BAŞARILI RESPONSE
        echo json_encode([
            'success' => true,
            'message' => 'Kayıt başarılı! Hoş geldiniz ' . $first_name . '!',
            'user' => [
                'id' => $user_id,
                'username' => $username,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'email' => $email
            ],
            'redirect' => '../kantin/page-login.html'
        ]);

        // ✅ LOG KAYDI
        error_log("Yeni kullanıcı kaydı: $username ($email) - ID: $user_id");

    } else {
        throw new Exception('Veritabanı kayıt hatası!');
    }

} catch (PDOException $e) {
    // Veritabanı hatası
    error_log("Database Error in register-handler.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Sistem hatası! Lütfen daha sonra tekrar deneyiniz.',
        'debug' => $e->getMessage() // Geliştirme aşamasında
    ]);

} catch (Exception $e) {
    // Genel hata
    error_log("General Error in register-handler.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>