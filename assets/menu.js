// Menu.js - Sadece menü ve ürün işlemleri
/* global $ */
const baseUrl = window.location.origin;
class MenuManager {
    
    constructor() {
        console.log('MenuManager başlatıldı');
        this.selectedCategoriesId = null;
        this.loadCategories();
    }

    // 1. KATEGORİLERİ YÜKLEYİP GÖSTER
    loadCategories() {
        console.log('🔄 loadCategories BAŞLADI');
        console.log('Kategoriler yükleniyor...');

        $.ajax({
            url: '/kantin/backend_api/categories.php',
            type: 'GET',
            dataType: 'json',
            timeout: 5000,
            success: (result) => {  
                console.log('Kategoriler response:', result);

                if (result.success) {
                    this.showCategories(result.data);
                } else {
                    console.error('Kategori hatası:', result.error);
                    this.showError('Kategoriler yüklenemedi: ' + result.error);
                }
            },
            error: (xhr, status, error) => {
                console.error('AJAX Hatası - Test verisi kullanılıyor:', {xhr, status, error});
                this.showError(`Kategoriler yüklenemedi: ${status} - ${error}`);
            }
        });
    }

    // 2. KATEGORİLERİ EKRANDA GÖSTER
    showCategories(categories) {
        
        console.log('Kategoriler gösteriliyor:', categories);
        
        // Swiper wrapper'ı bul
        const $swiperWrapper = $('#categories-container');
        const $template = $('#category-template');
        
        if ($swiperWrapper.length === 0) {
            console.error('Swiper wrapper bulunamadı!');
            return;
        }
        
        if ($template.length === 0) {
            console.error('categories-template bulunamadı!');
            return;
        }

        // Mevcut kategorileri temizle (ilk slide hariç - template)
        $swiperWrapper.find('.swiper-slide:not(:first)').remove();

        $.each(categories, (index, category) => {
            console.log('Kategori işleniyor:', category);
            
            // Yeni slide oluştur
            const $slideDiv = $('<div class="swiper-slide"></div>');
            const $categoryDiv = $template.clone();
            
            // Template ayarları
            $categoryDiv
                .attr('id', `category-${category.id}`)
                .removeAttr('style')
                .show()
                .addClass('category-item')
                .attr('data-category-id', category.id);
            
            // İçerik doldur
            $categoryDiv.find('.categories-name').text(category.category_name || category.categories_name);

            const $descElement = $categoryDiv.find('.categories-description');
            if (category.description) {
                $descElement.text(category.description).show();
            } else {
                $descElement.hide();
            }

            const $iconElement = $categoryDiv.find('.categories-icon');
            $iconElement.empty(); // eski içerik silinsin

            let iconClass = 'fa-solid fa-tags'; // default ikon

            switch (category.category_code) {
                case 'HOT':
                    iconClass = 'fa-solid fa-mug-hot';
                    break;
                case 'COLD':
                    iconClass = 'fa-solid fa-glass-water';
                    break;
                case 'COFFEE':
                    iconClass = 'fa-solid fa-mug-saucer';
                    break;
                case 'TEA':
                    iconClass = 'fa-solid fa-leaf';
                    break;
                case 'FRESH':
                    iconClass = 'fa-solid fa-blender';
                    break;
                case 'SNACKS':
                    iconClass = 'fa-solid fa-cookie-bite';
                    break;
            }

            // Seçilen ikonu HTML'e ekle
            $iconElement.append(`<i class="${iconClass}"></i>`);
            
            // Tıklama olayı
            $categoryDiv.on('click', () => {
                console.log('🚀🚀🚀 KATEGORİ TIKLANDI - ID:', category.id);
                console.log('🚀🚀🚀 selectCategory çağırılacak...');
                console.log('Kategori seçildi:', category.id);
                this.selectCategory(category.id);
            });
            
            // Slide'a template'i ekle ve swiper'a ekle
            $slideDiv.append($categoryDiv);
            $swiperWrapper.append($slideDiv);
        });
        
        console.log('Toplam kategori eklendi:', categories.length);
    }

    // 3. KATEGORİ SEÇ VE ÜRÜNLERİ YÜKLEYİP GÖSTER
    selectCategory(categoryId) {
        
        console.log('🔥🔥🔥 selectCategory ÇAĞRILDI - ID:', categoryId);
        console.log('🔥🔥🔥 Bu mesajı görüyorsanız fonksiyon çalışıyor');
        console.log('selectCategory çağrıldı - Kategori ID:', categoryId);
        
        // ID kontrolü
        if (!categoryId) {
            console.error('Kategori ID bulunamadı!');
            this.showError('Kategori seçilemedi. Kategori ID bulunamadı.');
            return;
        }
        
        // Önceki seçimi temizle ve yenisini işaretle
        $('.category-item').removeClass('border-primary selected');
        $(`[data-category-id="${categoryId}"]`).addClass('border-primary selected');
        
        this.selectedCategoriesId = categoryId;
        console.log('Seçili kategori ID set edildi:', this.selectedCategoriesId);
        
        // Loading göster
        this.showLoading();
        
        // Backend'e kategori ID'si gönder
        $.ajax({
            url: '/kantin/backend_api/products.php',
            type: 'GET',
            data: { 
                category_id: categoryId  
            },
            dataType: 'json',
            timeout: 10000,
            success: (result) => {
                console.log('*** SUCCESS CALLBACK ÇALIŞTI ***');
                console.log('Success:', result.success);
                console.log('Data count:', result.data ? result.data.length : 0);
                console.log('Full response:', result);
                
                if (result.success) {
                    if (result.data && result.data.length > 0) {
                        console.log('Ürünler bulundu:', result.data.length);
                        this.showProducts(result.data);
                    } else {
                        console.log('Bu kategoride ürün bulunamadı');
                        $('#products-container').html(`
                            <div class="col-12 text-center py-4">
                                <div class="alert alert-info">
                                    <h5>Bu kategoride ürün bulunamadı</h5>
                                    <p>Henüz bu kategoriye ürün eklenmemiş. <br>
                                    Kategori ID: ${categoryId}</p>
                                </div>
                            </div>
                        `);
                    }
                } else {
                    console.error('Backend hatası:', result.error);
                    this.showError('Backend hatası: ' + result.error);
                }
            },
            error: (xhr, status, error) => {
                console.error('=== AJAX HATASI ===');
                console.error('Status:', status);
                console.error('Error:', error);
                console.error('Response Text:', xhr.responseText);
                console.error('Status Code:', xhr.status);
                
                let errorMessage = `AJAX Hatası: ${status}`;
                if (xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMessage += `<br>Backend: ${errorResponse.error}`;
                    } catch(e) {
                        errorMessage += `<br>Response: ${xhr.responseText}`;
                    }
                }
                
                this.showError(errorMessage);
            }
        });
    }

    // 4. ÜRÜNLERİ EKRANDA GÖSTER
    showProducts(products) { 
        
        console.log('showProducts çağrıldı - Ürün sayısı:', products.length);
        console.log('İlk ürün örneği:', products[0]);
        
        const $container = $('#products-container');
        console.log('Container bulundu:', $container.length > 0);
        
        if ($container.length === 0) {
            console.error('products-container bulunamadı!');
            return;
        }

        // LOADING'İ HEMEN KALDIR - ZORLA TEMİZLE
        console.log('Container temizleniyor - Mevcut HTML:', $container.html().substring(0, 100));
        $container.empty();
        $container.html(''); // Ekstra temizlik
        console.log('Container temizlendi - Yeni HTML:', $container.html());

        if (products.length === 0) {
            console.log('Ürün bulunamadı mesajı gösteriliyor');
            $container.html(`
                <div class="col-12 text-center py-4">
                    <div class="alert alert-warning">
                        <h5>Bu kategoride ürün bulunamadı</h5>
                        <p>Başka bir kategori deneyin.</p>
                    </div>
                </div>
            `);
            return;
        }

        console.log('Ürünler işlenmeye başlanıyor...');

        try {
            $(".loader").addClass("d-none");
            $.each(products, (index, product) => {
                console.log(`Ürün ${index + 1} işleniyor:`, product);
                
                // Güvenli değer alma
                const productName = product.product_name || 'İsimsiz Ürün';
                const price = parseFloat(product.price || product.unit_price || 0).toFixed(2);
                const description = product.description || '';
                const isFeatured = parseInt(product.is_featured) === 1;
                
                // Görsel URL'i - varsayılan görsel
                let imageSrc = 'images/popular-img/pic-3.jpg'; // Varsayılan
                
                if (product.image_url) {
                    // Eğer tam URL ise olduğu gibi kullan
                    if (product.image_url.includes('http')) {
                        imageSrc = product.image_url;
                    } else {
                        // Yoksa images klasöründen al
                        imageSrc = `images/products/${product.image_url}`;
                    }
                }
                
                console.log(`Ürün ${index + 1} - İsim: ${productName}, Fiyat: ${price}, Görsel: ${imageSrc}`);
                
                // Ürün HTML'i oluştur
                const $productDiv = $(`
                    <div class="col-xl-4 col-xxl-4 col-sm-6 product-item mb-3">
                        <div class="card dishe-bx b-hover style-1">
                            <div class="card-body pb-0 pt-3">
                                <div class="text-center mb-2">
                                    <img src="${imageSrc}" alt="${productName}" 
                                         class="product-image" 
                                         style="width: 100px; height: 100px; object-fit: cover; border-radius: 10px;"
                                         onerror="this.src='images/popular-img/pic-3.jpg'; console.log('Görsel yüklenemedi: ${imageSrc}');">
                                </div>
                                <div class="border-bottom pb-3">
                                    <div class="d-flex align-items-center">
                                        ${isFeatured ? '<span class="badge bg-success">Öne Çıkan</span>' : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer border-0 pt-2">
                                <div class="common d-flex align-items-center justify-content-between">
                                    <div>
                                        <a href="javascript:void(0);">
                                            <h4 class="product-name">${productName}</h4>
                                        </a>
                                        <h3 class="mb-0 text-primary product-price">${price} ₺</h3>
                                        ${description ? `<p class="text-muted small product-description">${description}</p>` : ''}
                                    </div>
                                    <div class="plus c-pointer add-to-cart-btn" data-product-id="${product.id}">
                                        <div class="sub-bx">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                
                // Sepete ekle butonu olayı - CartManager'ı kullan
                $productDiv.find('.add-to-cart-btn').on('click', (e) => {
                    e.stopPropagation();
                    console.log('Sepete eklenecek ürün:', product);
                    
                    // CartManager'ın addItem metodunu çağır
                    if (window.cartManager) {
                        cartManager.addItem(product);
                    } else {
                        console.error('❌ CartManager bulunamadı!');
                    }
                });
                
                console.log(`Ürün ${index + 1} DOM'a eklendi`);
                $container.append($productDiv);
            });
            
            console.log('=== TÜM ÜRÜNLER EKLENDİ ===');
            console.log('Toplam ürün eklendi:', products.length);
            
        } catch(error) {
            console.error('showProducts hatası:', error);
            $container.html(`
                <div class="col-12">
                    <div class="alert alert-danger">
                        <strong>Hata!</strong> Ürünler gösterilirken hata oluştu: ${error.message}
                    </div>
                </div>
            `);
        }
    }

    // 5. YARDIMCI FONKSİYONLAR
    updateIcon($iconElement, iconUrl) {
        if (iconUrl.includes('http') || iconUrl.includes('/')) {
            $iconElement.replaceWith(`<img src="${iconUrl}" alt="icon" style="width: 50px; height: 50px;">`);
        } else if (iconUrl.includes('fa-')) {
            $iconElement.replaceWith(`<i class="fas ${iconUrl}" style="font-size: 50px; color: var(--primary);"></i>`);
        }
    }

    showLoading() {
        $('#products-container').html(`
            <div class="col-12 text-center py-5 loader">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <p class="mt-2">Ürünler yükleniyor...</p>
            </div>
        `);
    }

    showError(message) {
        $('#products-container').html(`
            <div class="col-12">
                <div class="alert alert-danger">
                    <strong>Hata!</strong> ${message}
                    <br><small>Test verileri kullanılıyor...</small>
                </div>
            </div>
        `);
    }

    // ✅ MESAJ GÖSTERME
    showMessage(message, type = 'success') {
        const alertClass = {
            success: 'alert-success',
            error: 'alert-danger', 
            info: 'alert-info'
        }[type] || 'alert-success';

        const $message = $(`
            <div class="alert ${alertClass} position-fixed" style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                <strong>${message}</strong>
                <button type="button" class="btn-close ms-2" onclick="$(this).parent().fadeOut()"></button>
            </div>
        `);
        
        $('body').append($message);
        
        setTimeout(() => {
            $message.fadeOut(() => $message.remove());
        }, 3000);
    }
}

// Sayfa yüklendiğinde başlat
let menuManager;
$(document).ready(() => {
    console.log('DOM hazır, MenuManager başlatılıyor...');
    
    menuManager = new MenuManager();
    
    // Debug için global erişim
    window.menuManager = menuManager;
    console.log('✅ MenuManager global olarak erişilebilir: window.menuManager');
});