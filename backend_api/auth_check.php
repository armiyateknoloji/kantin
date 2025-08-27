<?php
// backend_api/auth-check.php - Oturum doğrulama sistemi

// Session başlat
session_start();

// Veritabanı bağlantısı
require_once 'database.php';

// ✅ KULLANICI GİRİŞ YAPMIŞ MI KONTROL ET
function isUserLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true && isset($_SESSION['user_id']);
}

// ✅ REMEMBER ME TOKEN KONTROL ET
function checkRememberToken() {
    if (!isset($_COOKIE['remember_token']) || !isset($_COOKIE['remember_user'])) {
        return false;
    }
    
    global $pdo;
    
    try {
        $user_id = (int)$_COOKIE['remember_user'];
        $token = $_COOKIE['remember_token'];
        
        $stmt = $pdo->prepare("
            SELECT id, username, email, first_name, last_name, company_id, department_id, role_id
            FROM users 
            WHERE id = ? AND remember_token = ? AND remember_expires > NOW() AND is_active = 1
        ");
        $stmt->execute([$user_id, $token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Session'ı yeniden oluştur
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['first_name'] = $user['first_name'];
            $_SESSION['last_name'] = $user['last_name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['company_id'] = $user['company_id'];
            $_SESSION['department_id'] = $user['department_id'];
            $_SESSION['role_id'] = $user['role_id'];
            $_SESSION['logged_in'] = true;
            $_SESSION['login_time'] = time();
            $_SESSION['auto_login'] = true; // Remember token ile giriş
            
            // Last login güncelle
            $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            return true;
        }
        
    } catch (Exception $e) {
        error_log("Remember token error: " . $e->getMessage());
    }
    
    // Geçersiz token'ları temizle
    clearRememberCookies();
    return false;
}

// ✅ REMEMBER COOKIE'LERİNİ TEMİZLE
function clearRememberCookies() {
    setcookie('remember_token', '', time() - 3600, '/');
    setcookie('remember_user', '', time() - 3600, '/');
}

// ✅ KULLANICI BİLGİLERİNİ AL
function getCurrentUser() {
    if (!isUserLoggedIn()) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'first_name' => $_SESSION['first_name'],
        'last_name' => $_SESSION['last_name'],
        'email' => $_SESSION['email'],
        'full_name' => $_SESSION['first_name'] . ' ' . $_SESSION['last_name'],
        'company_id' => $_SESSION['company_id'] ?? null,
        'department_id' => $_SESSION['department_id'] ?? null,
        'role_id' => $_SESSION['role_id'] ?? null
    ];
}

// ✅ ÇIKIŞ FONKSİYONU
function logout() {
    global $pdo;
    
    // Remember token'ı veritabanından sil
    if (isset($_SESSION['user_id'])) {
        try {
            $stmt = $pdo->prepare("UPDATE users SET remember_token = NULL, remember_expires = NULL WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
        } catch (Exception $e) {
            error_log("Logout token clear error: " . $e->getMessage());
        }
    }
    
    // Session'ı temizle
    $_SESSION = array();
    
    // Session cookie'sini sil
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 42000, '/');
    }
    
    // Remember cookie'lerini sil
    clearRememberCookies();
    
    // Session'ı yok et
    session_destroy();
}

// ✅ SESSION TIMEOUT KONTROL (30 dakika)
function checkSessionTimeout() {
    if (isset($_SESSION['login_time'])) {
        $timeout = 30 * 60; // 30 dakika
        
        if (time() - $_SESSION['login_time'] > $timeout) {
            logout();
            return false;
        }
        
        // Session süresini yenile (kullanıcı aktifse)
        $_SESSION['login_time'] = time();
    }
    
    return true;
}

// ✅ GİRİŞ GEREKSEN YÖNLENDİR
function requireLogin($redirect_to = 'login.html') {
    if (!isAuthenticated()) {
        // AJAX isteği mi?
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
                'redirect' => $redirect_to,
                'auth_required' => true
            ]);
            exit;
        }
        
        // Normal sayfa isteği
        header("Location: $redirect_to");
        exit;
    }
}

// ✅ FULL AUTHENTİCATİON CHECK
function isAuthenticated() {
    // Session kontrolü
    if (isUserLoggedIn()) {
        return checkSessionTimeout();
    }
    
    // Remember token kontrolü
    if (checkRememberToken()) {
        return true;
    }
    
    return false;
}

// ✅ SAYFA KORUMA (include etmek için)
function protectPage($redirect_to = 'login.html') {
    if (!isAuthenticated()) {
        header("Location: $redirect_to");
        exit;
    }
}

// ✅ KULLANICI ROL KONTROL
function hasRole($required_role_id) {
    $user = getCurrentUser();
    return $user && $user['role_id'] == $required_role_id;
}

// ✅ ADMIN KONTROL
function isAdmin() {
    return hasRole(1); // 1 = admin role
}

// ✅ AUTH STATUS API ENDPOINT
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['check_auth'])) {
    header('Content-Type: application/json');
    
    $authenticated = isAuthenticated();
    $user = $authenticated ? getCurrentUser() : null;
    
    echo json_encode([
        'authenticated' => $authenticated,
        'user' => $user,
        'session_remaining' => $authenticated && isset($_SESSION['login_time']) ? 
            (30 * 60) - (time() - $_SESSION['login_time']) : 0
    ]);
    exit;
}

// ✅ LOGOUT ENDPOİNT
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['logout'])) {
    logout();
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Çıkış yapıldı.',
        'redirect' => 'login.html'
    ]);
    exit;
}
?>