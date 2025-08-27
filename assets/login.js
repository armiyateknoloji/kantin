/**
 * FoodDesk Login System - Düzeltilmiş Versiyon
 * Mevcut HTML formunuzla çalışacak şekilde tasarlandı
 */

$(document).ready(function() {
    // Sayfa yüklendiğinde oturum kontrolü yap
    checkExistingAuth();
    
    // Form gönderimi - mevcut formunuzun action'ını override ediyoruz
    $('form[action*="index.html"]').on('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    // Input alanları için gerçek zamanlı feedback
    $('input[type="email"], input[type="password"]').on('input', function() {
        $(this).removeClass('is-invalid');
        $(this).next('.invalid-feedback').remove();
    });
});

/**
 * Mevcut oturum kontrolü - eğer zaten giriş yapmışsa dashboard'a yönlendir
 */
function checkExistingAuth() {
    $.get('auth_check.php?action=check_auth')
        .done(function(response) {
            if (response.authenticated) {
                // Sessizce dashboard'a yönlendir
                window.location.href = 'index.html';
            }
        })
        .fail(function() {
            // Hata durumunda sessiz kal
        });
}

/**
 * Ana giriş işlemi
 */
function handleLogin() {
    // Form verilerini mevcut inputlardan al
    const email = $('input[type="email"]').val().trim();
    const password = $('input[type="password"]').val();
    const remember = $('input[type="checkbox"]').is(':checked');
    
    // Basit validasyon
    if (!email || !password) {
        showError('Email ve şifre alanları boş olamaz');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Geçerli bir email adresi girin');
        return;
    }
    
    // Loading durumu
    const submitBtn = $('button[type="submit"]');
    const originalText = submitBtn.text();
    submitBtn.prop('disabled', true).text('Giriş yapılıyor...');
    
    // FormData kullanarak POST verisi hazırla (PHP $_POST ile uyumlu)
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (remember) {
        formData.append('remember_me', '1');
    }
    
    // AJAX isteği - FormData ile
    $.ajax({
        url: 'backend_api/login-handler.php',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        timeout: 10000
    })
    .done(function(response) {
        console.log('Server response:', response); // Debug için
        
        if (response.success) {
            showSuccess(response.message);
            // 1.5 saniye sonra yönlendir
            setTimeout(function() {
                window.location.href = response.redirect || 'index.html';
            }, 1500);
        } else {
            // Hata mesajını detaylı göster
            let errorMessage = response.message;
            if (response.errors && response.errors.length > 0) {
                errorMessage += '\n• ' + response.errors.join('\n• ');
            }
            showError(errorMessage);
            resetButton();
        }
    })
    .fail(function(xhr, status, error) {
        console.error('AJAX Error:', xhr.responseText); // Debug için
        
        let errorMessage = 'Giriş yapılamadı. Lütfen tekrar deneyin.';
        
        if (status === 'timeout') {
            errorMessage = 'İstek zaman aşımına uğradı.';
        } else if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
        } else if (xhr.responseText) {
            // PHP hatası varsa göster
            console.error('PHP Error:', xhr.responseText);
            errorMessage = 'Sunucu hatası oluştu.';
        }
        
        showError(errorMessage);
        resetButton();
    });
    
    function resetButton() {
        submitBtn.prop('disabled', false).text(originalText);
    }
}

/**
 * Email validasyonu
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Başarı mesajı göster (SweetAlert yoksa basit alert)
 */
function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Başarılı!',
            text: message,
            showConfirmButton: false,
            timer: 1500
        });
    } else {
        alert('✓ ' + message);
    }
}

/**
 * Hata mesajı göster - Daha detaylı
 */
function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Hata!',
            text: message,
            confirmButtonColor: '#d33'
        });
    } else {
        alert('✗ ' + message);
    }
}

/**
 * Çıkış işlemi - diğer sayfalarda kullanmak için
 */
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        window.location.href = 'auth_check.php?action=logout';
    }
}

/**
 * Kullanıcı bilgilerini al - diğer sayfalarda kullanmak için
 */
function getCurrentUser(callback) {
    $.get('auth_check.php?action=check_auth')
        .done(function(response) {
            if (response.authenticated) {
                callback(response.user);
            } else {
                callback(null);
            }
        })
        .fail(function() {
            callback(null);
        });
}