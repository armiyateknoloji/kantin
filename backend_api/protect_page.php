<?php
/**
 * Sayfa koruması - korunan sayfalarda include edin
 * Örnek kullanım: require_once 'protect_page.php';
 */

require_once 'auth_check.php';

// Kullanıcı giriş yapmış mı kontrol et
$currentUser = getUserFromCookie();

if (!$currentUser) {
    // Giriş yapmamış, login sayfasına yönlendir
    header('Location: page-login.html');
    exit();
}

// Kullanıcı bilgilerini global değişkende sakla
$GLOBALS['current_user'] = $currentUser;

/**
 * Mevcut kullanıcı bilgilerini al
 */
function getCurrentUser() {
    return $GLOBALS['current_user'] ?? null;
}

/**
 * Kullanıcının rolünü kontrol et
 */
function hasRole($roleId) {
    $user = getCurrentUser();
    return $user && $user['role_id'] == $roleId;
}

/**
 * Kullanıcının şirketini kontrol et
 */
function hasCompany($companyId) {
    $user = getCurrentUser();
    return $user && $user['company_id'] == $companyId;
}

/**
 * JavaScript'te kullanmak için kullanıcı bilgilerini JSON olarak çıkar
 */
function printUserDataForJS() {
    $user = getCurrentUser();
    if ($user) {
        echo "<script>window.currentUser = " . json_encode($user) . ";</script>\n";
    }
}
?>