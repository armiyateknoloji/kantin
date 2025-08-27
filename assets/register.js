// assets/register.js - Kayıt formu jQuery ile
$(document).ready(function() {
    console.log('📝 Register.js yüklendi');

    // ✅ FORM SUBMIT İŞLEMİ
    $('form').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        const originalBtnText = $submitBtn.html();
        
        // Form verilerini al
        const formData = {
            first_name: $('input[name="first_name"]').val().trim(),
            last_name: $('input[name="last_name"]').val().trim(),
            username: $('input[name="username"]').val().trim(),
            email: $('input[name="email"]').val().trim(),
            password: $('input[name="password"]').val(),
            phone: $('input[name="phone"]').val().trim(),
        };

        // ✅ CLIENT-SIDE VALIDATION
        const errors = [];

        if (!formData.first_name) errors.push('İsim alanı zorunludur!');
        if (!formData.last_name) errors.push('Soyisim alanı zorunludur!');
        if (!formData.username) errors.push('Kullanıcı adı zorunludur!');
        if (!formData.email) errors.push('Email alanı zorunludur!');
        if (!formData.password) errors.push('Şifre alanı zorunludur!');

        // Email format kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            errors.push('Geçerli bir email adresi giriniz!');
        }

        // Şifre uzunluk kontrolü
        if (formData.password && formData.password.length < 6) {
            errors.push('Şifre en az 6 karakter olmalıdır!');
        }

        // Telefon kontrolü (opsiyonel)
        if (formData.phone) {
            const phoneRegex = /^(\+90|0)?5[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
            if (!phoneRegex.test(formData.phone)) {
                errors.push('Geçerli bir telefon numarası giriniz! (+90 5xx xxx xx xx)');
            }
        }

        // Hata varsa göster
        if (errors.length > 0) {
            showMessage('Lütfen aşağıdaki hataları düzeltiniz:', 'error');
            errors.forEach(error => {
                showMessage(error, 'error');
            });
            return;
        }

        // ✅ LOADING STATE
        $submitBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Kaydediliyor...').prop('disabled', true);
        
        // ✅ AJAX İSTEĞİ
        $.ajax({
            url: 'backend_api/register-handler.php',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                console.log('✅ Register response:', response);
                
                if (response.success) {
                    showMessage(response.message, 'success');
                    
                    // 2 saniye sonra yönlendir
                    setTimeout(function() {
                        window.location.href = response.redirect || 'index.html';
                    }, 2000);
                    
                } else {
                    showMessage(response.message, 'error');
                    
                    // Çoklu hata mesajları varsa
                    if (response.errors && Array.isArray(response.errors)) {
                        response.errors.forEach(function(error) {
                            showMessage(error, 'error');
                        });
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ AJAX Hatası:', error);
                console.log('Response:', xhr.responseText);
                
                let errorMessage = 'Bağlantı hatası! Lütfen tekrar deneyiniz.';
                
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.message) {
                        errorMessage = response.message;
                    }
                } catch (e) {
                    // JSON parse hatası, default mesaj kullan
                }
                
                showMessage(errorMessage, 'error');
            },
            complete: function() {
                // ✅ LOADING STATE'İ KALDIR
                $submitBtn.html(originalBtnText).prop('disabled', false);
            }
        });
    });

    // ✅ REAL-TIME VALIDATION (İsteğe bağlı)
    $('input[name="email"]').on('blur', function() {
        const email = $(this).val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            $(this).addClass('is-invalid');
            if (!$(this).next('.invalid-feedback').length) {
                $(this).after('<div class="invalid-feedback">Geçerli bir email adresi giriniz!</div>');
            }
        } else {
            $(this).removeClass('is-invalid').next('.invalid-feedback').remove();
        }
    });

    $('input[name="password"]').on('input', function() {
        const password = $(this).val();
        
        if (password && password.length < 6) {
            $(this).addClass('is-invalid');
            if (!$(this).next('.invalid-feedback').length) {
                $(this).after('<div class="invalid-feedback">Şifre en az 6 karakter olmalıdır!</div>');
            }
        } else {
            $(this).removeClass('is-invalid').next('.invalid-feedback').remove();
        }
    });

    // ✅ MESAJ GÖSTERME FONKSİYONU
    function showMessage(message, type = 'info') {
        const alertClass = {
            success: 'alert-success',
            error: 'alert-danger',
            info: 'alert-info',
            warning: 'alert-warning'
        }[type] || 'alert-info';

        const $alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;">
                <i class="fas fa-${getIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" onclick="$(this).parent().fadeOut()"></button>
            </div>
        `);

        $('body').append($alert);
        
        // 5 saniye sonra otomatik kaldır
        setTimeout(function() {
            $alert.fadeOut(function() {
                $alert.remove();
            });
        }, 5000);
    }

    // ✅ IKON HELPERİ
    function getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            info: 'info-circle',
            warning: 'exclamation-circle'
        };
        return icons[type] || 'info-circle';
    }

    // ✅ ŞIFRE GÖZÜ (İsteğe bağlı)
    function addPasswordToggle() {
        const $passwordContainer = $('input[name="password"]').parent();
        $passwordContainer.css('position', 'relative');
        
        const $toggleBtn = $(`
            <button type="button" class="btn btn-link position-absolute" 
                    style="right: 10px; top: 50%; transform: translateY(-50%); padding: 0; border: none; color: #6c757d;">
                <i class="fas fa-eye"></i>
            </button>
        `);
        
        $passwordContainer.append($toggleBtn);
        
        $toggleBtn.on('click', function() {
            const $password = $('input[name="password"]');
            const type = $password.attr('type') === 'password' ? 'text' : 'password';
            $password.attr('type', type);
            $(this).find('i').toggleClass('fa-eye fa-eye-slash');
        });
    }

    // Şifre toggle'ı aktif et (isterseniz)
    // addPasswordToggle();

    console.log('✅ Register form hazır');
});