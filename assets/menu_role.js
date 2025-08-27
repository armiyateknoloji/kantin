$(document).ready(function() {
    $.getJSON('backend_api/auth-check.php?check_auth', function(response) {
        if (response.authenticated) {
            const roleName = response.user.role_name;

            // Tüm kullanıcıların görebileceği menü
            $('[data-role="all"]').show();

            // Rol bazlı menü gösterimi
            $('[data-role]').each(function() {
                const itemRole = $(this).data('role');
                if (itemRole === roleName) {
                    $(this).show();
                }
            });

        } else {
            // Oturum yoksa login sayfasına yönlendir
            window.location.href = 'login.html';
        }
    });
});
