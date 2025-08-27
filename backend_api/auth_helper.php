<?php
// backend_api/auth_helper.php - Rol yönetim sistemi
class RoleManager {
    
    // Rol bazlı sayfa erişim haritası
    private static $pagePermissions = [
        'admin' => [
            'admin-panel.html',
            'user-management.html', 
            'reports.html',
            'settings.html',
            'dashboard.html'
        ],
        'manager' => [
            'dashboard.html',
            'reports.html',
            'team-management.html'
        ],
        'employee' => [
            'dashboard.html',
            'profile.html'
        ],
        'user' => [
            'profile.html',
            'basic-info.html'
        ]
    ];
    
    // Kullanıcı rolünü al (veritabanından)
    public static function getUserRoleName($roleId, $pdo) {
        $stmt = $pdo->prepare("SELECT role_name FROM users WHERE id = ?");
        $stmt->execute([$roleId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['role_name'] : null;
    }
    
    // Sayfa erişim kontrolü
    public static function canAccessPage($userRole, $pageName) {
        if (!isset(self::$pagePermissions[$userRole])) {
            return false;
        }
        
        return in_array($pageName, self::$pagePermissions[$userRole]);
    }
    
    // Kullanıcının erişebileceği sayfaları getir
    public static function getUserPages($userRole) {
        return self::$pagePermissions[$userRole] ?? [];
    }
    
    // Rol hiyerarşisi kontrolü
    public static function hasMinimumRole($userRole, $requiredRole) {
        $roleHierarchy = [
            'admin' => 1,
            'company_admin' => 2,
            'cafe_staff' => 3,
            'employee' => 4
        ];
        
        $userLevel = $roleHierarchy[$userRole] ?? 0;
        $requiredLevel = $roleHierarchy[$requiredRole] ?? 0;
        
        return $userLevel >= $requiredLevel;
    }
}

// backend_api/check_access.php - Sayfa erişim kontrolü
session_start();
require_once 'database.php';
require_once 'auth_helper.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // Giriş yapılmış mı kontrol et
    if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
        echo json_encode([
            'success' => false,
            'message' => 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapınız.',
            'redirect' => 'login.html'
        ]);
        exit;
    }
    
    $requestedPage = $_GET['page'] ?? '';
    $roleName = $_SESSION['role_name'] ?? '';
    
    if (!$roleName) {
        echo json_encode([
            'success' => false,
            'message' => 'Geçersiz rol bilgisi!'
        ]);
        exit;
    }
    
    // Sayfa erişim kontrolü
    if (RoleManager::canAccessPage($roleName, $requestedPage)) {
        echo json_encode([
            'success' => true,
            'message' => 'Erişim izni var',
            'user_role' => $roleName,
            'accessible_pages' => RoleManager::getUserPages($roleName)
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Bu sayfaya erişim yetkiniz bulunmamaktadır!',
            'redirect' => 'dashboard.html'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Access check error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Sistem hatası!'
    ]);
}

// backend_api/get_user_menu.php - Kullanıcı menüsünü getir
session_start();
require_once 'database.php';
require_once 'auth_helper.php';

header('Content-Type: application/json; charset=utf-8');

try {
    if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
        echo json_encode(['success' => false, 'message' => 'Oturum yok']);
        exit;
    }
    
    $roleId = $_SESSION['role_id'] ?? 0;
    $roleName = RoleManager::getUserRoleName($roleId, $pdo);
    
    // Menü öğeleri - rol bazlı
    $menuItems = [
        'admin' => [
            ['title' => 'Dashboard', 'url' => 'dashboard.html', 'icon' => 'fas fa-tachometer-alt'],
            ['title' => 'Kullanıcı Yönetimi', 'url' => 'user-management.html', 'icon' => 'fas fa-users'],
            ['title' => 'Raporlar', 'url' => 'reports.html', 'icon' => 'fas fa-chart-bar'],
            ['title' => 'Admin Panel', 'url' => 'admin-panel.html', 'icon' => 'fas fa-cog'],
            ['title' => 'Ayarlar', 'url' => 'settings.html', 'icon' => 'fas fa-wrench']
        ],
        'manager' => [
            ['title' => 'Dashboard', 'url' => 'dashboard.html', 'icon' => 'fas fa-tachometer-alt'],
            ['title' => 'Takım Yönetimi', 'url' => 'team-management.html', 'icon' => 'fas fa-users'],
            ['title' => 'Raporlar', 'url' => 'reports.html', 'icon' => 'fas fa-chart-bar']
        ],
        'employee' => [
            ['title' => 'Dashboard', 'url' => 'dashboard.html', 'icon' => 'fas fa-tachometer-alt'],
            ['title' => 'Profilim', 'url' => 'profile.html', 'icon' => 'fas fa-user']
        ],
        'user' => [
            ['title' => 'Profilim', 'url' => 'profile.html', 'icon' => 'fas fa-user'],
            ['title' => 'Temel Bilgiler', 'url' => 'basic-info.html', 'icon' => 'fas fa-info-circle']
        ]
    ];
    
    echo json_encode([
        'success' => true,
        'user_role' => $roleName,
        'menu_items' => $menuItems[$roleName] ?? [],
        'user_info' => [
            'name' => $_SESSION['first_name'] . ' ' . $_SESSION['last_name'],
            'email' => $_SESSION['email']
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Sistem hatası']);
}
?>