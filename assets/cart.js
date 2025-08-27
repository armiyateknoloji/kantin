// CartManager.js - Sepet yönetimi için ayrı sınıf (Güncellenmiş Div Yapısı)
/* global $ */

class CartManager {
    constructor() {
        console.log('🛒 CartManager başlatıldı');
        
        this.cart = {
            items: [],
            total: 0,
            itemCount: 0
        };
        
        this.init();
    }
    
    // ✅ BAŞLATMA
    init() {
        this.loadCartFromCookie(); // Cookie'den sepeti yükle
        this.initUI();
        this.attachEvents();
        this.updateDisplay();
    }
    
    // ✅ UI BAŞLATMA
    initUI() {
        // Sepet badge'ini güncelle
        this.updateBadge();
        
        // Sepet ikonuna tıklama olayı (varsa modal için)
        $(document).on('click', '#cart-toggle, .cart-icon', () => {
            this.showModal();
        });
    }
    
    // ✅ SEPETE ÜRÜN EKLE
    addItem(product) {
        console.log('🛒 Sepete ekleniyor:', product);
        
        if (!product || !product.id) {
            console.error('❌ Geçersiz ürün verisi!');
            this.showMessage('Ürün sepete eklenemedi!', 'error');
            return false;
        }

        // Mevcut ürünü bul
        const existingItemIndex = this.cart.items.findIndex(item => 
            parseInt(item.id) === parseInt(product.id)
        );
        
        if (existingItemIndex !== -1) {
            // Var olan ürünün miktarını artır
            this.cart.items[existingItemIndex].quantity += 1;
            console.log('➕ Mevcut ürün miktarı artırıldı');
        } else {
            // Yeni ürün ekle
            const cartItem = {
                id: parseInt(product.id),
                name: product.product_name || 'İsimsiz Ürün',
                price: parseFloat(product.price || product.unit_price || 0),
                quantity: 1,
                image: product.image_url || 'images/popular-img/pic-3.jpg',
                addedAt: new Date().toISOString()
            };
            
            this.cart.items.push(cartItem);
            console.log('✅ Yeni ürün sepete eklendi');
        }

        // UI güncelle
        this.updateTotals();
        this.updateDisplay();
        this.updateBadge();
        this.saveCartToCookie(); // Cookie'ye kaydet
        
        // Başarı mesajı
        this.showMessage(`${product.product_name} sepete eklendi!`, 'success');
        
        return true;
    }
    
    // ✅ MIKTAR ARTIR
    increaseQuantity(productId) {
        const item = this.cart.items.find(item => parseInt(item.id) === parseInt(productId));
        
        if (item) {
            item.quantity += 1;
            this.updateTotals();
            this.updateDisplay();
            this.updateBadge();
            this.saveCartToCookie(); // Cookie'ye kaydet
            this.showMessage(`${item.name} miktarı artırıldı`, 'info');
        }
    }
    
    // ✅ MIKTAR AZALT
    decreaseQuantity(productId) {
        const item = this.cart.items.find(item => parseInt(item.id) === parseInt(productId));
        
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                this.updateTotals();
                this.updateDisplay();
                this.updateBadge();
                this.saveCartToCookie(); // Cookie'ye kaydet
                this.showMessage(`${item.name} miktarı azaltıldı`, 'info');
            } else {
                this.removeItem(productId);
            }
        }
    }
    
    // ✅ ÜRÜN SİL
    removeItem(productId) {
        const itemIndex = this.cart.items.findIndex(item => parseInt(item.id) === parseInt(productId));
        
        if (itemIndex === -1) {
            console.error('❌ Silinecek ürün bulunamadı');
            return;
        }
        
        const removedItem = this.cart.items[itemIndex];
        
        if (confirm(`"${removedItem.name}" ürününü sepetten kaldırmak istediğinizden emin misiniz?`)) {
            this.cart.items.splice(itemIndex, 1);
            this.updateTotals();
            this.updateDisplay();
            this.updateBadge();
            this.saveCartToCookie(); // Cookie'ye kaydet
            this.showMessage(`${removedItem.name} sepetten kaldırıldı!`, 'success');
        }
    }
    
    // ✅ SEPETI TEMİZLE
    clear() {
        if (this.cart.items.length === 0) {
            this.showMessage('Sepet zaten boş!', 'info');
            return;
        }

        if (confirm('Sepetteki tüm ürünleri kaldırmak istediğinizden emin misiniz?')) {
            this.cart = { items: [], total: 0, itemCount: 0 };
            this.updateDisplay();
            this.updateBadge();
            this.saveCartToCookie(); // Cookie'ye kaydet
            this.showMessage('🧹 Sepet temizlendi!', 'info');
        }
    }
    
    // ✅ SEPET TOPLAMLARINI HESAPLA
    updateTotals() {
        this.cart.itemCount = this.cart.items.reduce((total, item) => total + item.quantity, 0);
        this.cart.total = this.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // ✅ SEPET BADGE GÜNCELLEMESİ
    updateBadge() {
        const badge = $('.cart-badge');
        if (this.cart.itemCount > 0) {
            badge.text(this.cart.itemCount).show();
        } else {
            badge.hide();
        }
    }
    
    // ✅ SEPET GÖRÜNÜMÜNÜ GÜNCELLE (Yeni div yapınıza göre düzenlendi)
    updateDisplay() {
        const $cartContainer = $('#cart-container');
        
        if ($cartContainer.length === 0) {
            console.warn('⚠️ #cart-container bulunamadı');
            return;
        }
        
        // Boş sepet durumu
        if (this.cart.items.length === 0) {
            $cartContainer.html(`
                <div class="card-body pt-0 pb-2">
                    <div class="text-center py-4">
                        <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Sepetiniz boş</p>
                        <small class="text-muted">Ürün eklemek için menüden seçim yapın</small>
                    </div>
                </div>
                <div class="card-footer pt-0 border-0">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <h4 class="font-w500">Total</h4>
                        <h3 class="font-w500 text-primary">0.00 ₺</h3>
                    </div>
                    <button class="btn btn-primary btn-block" id="place-order-btn">Sipariş Ver</button>
                </div>
            `);
            return;
        }
        
        // Card body - Ürünler listesi
        let cardBodyHTML = '<div class="card-body pt-0 pb-2">';
        
        this.cart.items.forEach((item, index) => {
            cardBodyHTML += this.createItemHTML(item);
            // Son ürün değilse HR ekle
            if (index < this.cart.items.length - 1) {
                cardBodyHTML += '<hr class="my-2 text-primary" style="opacity:0.9"/>';
            }
        });
        
        cardBodyHTML += '</div>'; // card-body kapanış
        
        // Card footer - Toplam ve sipariş ver butonu
        const cardFooterHTML = `
            <div class="card-footer pt-0 border-0">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h4 class="font-w500">Total</h4>
                    <h3 class="font-w500 text-primary">${this.cart.total.toFixed(2)} ₺</h3>
                </div>
                <button class="btn btn-primary btn-block" id="place-order-btn">Sipariş Ver</button>
                <button class="btn btn-outline-danger btn-sm mt-2 w-100" id="clear-cart-btn">
                    <i class="fas fa-trash me-2"></i>Sepeti Temizle
                </button>
            </div>
        `;
        
        // Container'a HTML'i yerleştir
        $cartContainer.html(cardBodyHTML + cardFooterHTML);
    }
    
    // ✅ SEPET ÜRÜN HTML OLUŞTUR (Yeni div yapınıza göre düzenlendi)
    createItemHTML(item) {
        let imageSrc = item.image;
        if (!imageSrc.includes('http') && !imageSrc.startsWith('images/')) {
            imageSrc = `images/products/${imageSrc}`;
        }
        
        return `
            <div class="order-check d-flex align-items-center my-3" data-item-id="${item.id}">
                <div class="dlab-media">
                    <img src="${imageSrc}" alt="${item.name}" 
                         onerror="this.src='images/popular-img/review-img/pic-1.jpg'">
                </div>
                <div class="dlab-info">
                    <div class="d-flex align-items-center justify-content-between">
                        <h4 class="dlab-title">
                            <a href="javascript:void(0);">${item.name}</a>
                        </h4>
                        <h4 class="text-primary ms-2">+${(item.price * item.quantity).toFixed(2)} ₺</h4>
                    </div>
                    <div class="d-flex align-items-center justify-content-between">
                        <span>x${item.quantity}</span>
                        <div class="quntity">
                            <button data-decrease data-item-id="${item.id}">-</button>
                            <input data-value type="text" value="${item.quantity}" readonly />
                            <button data-increase data-item-id="${item.id}">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ✅ EVENT LISTENER'LARI BAĞLA (Yeni div yapısına göre güncellendi)
    attachEvents() {
        // Miktar azalt butonu
        $(document).on('click', '[data-decrease]', (e) => {
            const itemId = $(e.target).data('item-id');
            if (itemId) {
                this.decreaseQuantity(itemId);
            }
        });
        
        // Miktar artır butonu
        $(document).on('click', '[data-increase]', (e) => {
            const itemId = $(e.target).data('item-id');
            if (itemId) {
                this.increaseQuantity(itemId);
            }
        });
        
        // Sepeti temizle butonu
        $(document).on('click', '#clear-cart-btn', () => {
            this.clear();
        });
        
        // Sipariş ver butonu
        $(document).on('click', '#place-order-btn', () => {
            this.placeOrder();
        });
        
        // Miktar input'una manual değer girişi (opsiyonel)
        $(document).on('change', '[data-value]', (e) => {
            const $input = $(e.target);
            const $container = $input.closest('.order-check');
            const itemId = $container.data('item-id');
            const newQuantity = parseInt($input.val()) || 1;
            
            if (newQuantity > 0) {
                this.updateItemQuantity(itemId, newQuantity);
            } else {
                $input.val(1);
                this.showMessage('Miktar 1\'den az olamaz!', 'error');
            }
        });
    }
    
    // ✅ ÜRÜN MİKTARINI DOĞRUDAN GÜNCELLEMESİ (Manual input için)
    updateItemQuantity(productId, newQuantity) {
        const item = this.cart.items.find(item => parseInt(item.id) === parseInt(productId));
        
        if (item) {
            item.quantity = Math.max(1, newQuantity);
            this.updateTotals();
            this.updateDisplay();
            this.updateBadge();
            this.saveCartToCookie(); // Cookie'ye kaydet
        }
    }
    
    // ✅ SİPARİŞ VER
    placeOrder() {
        if (this.cart.items.length === 0) {
            this.showMessage('Sepetiniz boş! Önce ürün ekleyin.', 'error');
            return;
        }
        
        const $orderBtn = $('#place-order-btn');
        const originalText = $orderBtn.html();
        
        if (confirm(`Toplam ${this.cart.total.toFixed(2)} ₺ tutarındaki siparişi onaylıyor musunuz?`)) {
            $orderBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Sipariş veriliyor...').prop('disabled', true);
            
            // Siparişi cookie'ye kaydet
            const order = {
                id: Date.now(), // Benzersiz sipariş ID'si
                items: [...this.cart.items],
                total: this.cart.total,
                orderDate: new Date().toISOString(),
                status: 'pending'
            };
            
            this.saveOrderToCookie(order);
            
            setTimeout(() => {
                this.showMessage('🎉 Siparişiniz başarıyla alındı!', 'success');
                // Sepeti sessizce temizle (onay sormadan)
                this.cart = { items: [], total: 0, itemCount: 0 };
                this.updateDisplay();
                this.updateBadge();
                this.saveCartToCookie();
                $orderBtn.html(originalText).prop('disabled', false);
            }, 2000);
        }
    }
    
    // ✅ SEPET MODAL GÖSTER (İsteğe bağlı)
    showModal() {
        // Modal kodları buraya
        console.log('Sepet modal açılacak...');
    }
    
    // ✅ MESAJ GÖSTER
    showMessage(message, type = 'success') {
        const alertClass = {
            success: 'alert-success',
            error: 'alert-danger', 
            info: 'alert-info'
        }[type] || 'alert-success';

        const $message = $(`
            <div class="alert ${alertClass} position-fixed" style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                ${message}
                <button type="button" class="btn-close ms-2" onclick="$(this).parent().fadeOut()"></button>
            </div>
        `);
        
        $('body').append($message);
        setTimeout(() => $message.fadeOut(() => $message.remove()), 3000);
    }
    
    // ✅ COOKIE FONKSİYONLARI
    
    // Sepeti cookie'ye kaydet
    saveCartToCookie() {
        try {
            const cartData = JSON.stringify(this.cart);
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            
            document.cookie = `cart=${encodeURIComponent(cartData)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
            console.log('✅ Sepet cookie\'ye kaydedildi');
        } catch (error) {
            console.error('❌ Sepet cookie\'ye kaydedilirken hata:', error);
        }
    }
    
    // Cookie'den sepeti yükle
    loadCartFromCookie() {
        try {
            const cookies = document.cookie.split(';');
            const cartCookie = cookies.find(cookie => cookie.trim().startsWith('cart='));
            
            if (cartCookie) {
                const cartData = decodeURIComponent(cartCookie.split('=')[1]);
                const savedCart = JSON.parse(cartData);
                
                // Veri doğrulama
                if (savedCart && savedCart.items && Array.isArray(savedCart.items)) {
                    // Eski veriyi temizle (7 günden eski)
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    
                    savedCart.items = savedCart.items.filter(item => {
                        if (!item.addedAt) return true; // Eski veriler için
                        return new Date(item.addedAt) > sevenDaysAgo;
                    });
                    
                    this.cart = savedCart;
                    this.updateTotals(); // Toplamları yeniden hesapla
                    console.log('✅ Sepet cookie\'den yüklendi:', this.cart);
                } else {
                    throw new Error('Geçersiz sepet verisi');
                }
            }
        } catch (error) {
            console.error('❌ Cookie\'den sepet yüklenirken hata:', error);
            this.cart = { items: [], total: 0, itemCount: 0 };
            // Bozuk cookie'yi temizle
            this.clearCartCookie();
        }
    }
    
    // Bozuk sepet cookie'sini temizle
    clearCartCookie() {
        document.cookie = 'cart=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        console.log('🧹 Bozuk sepet cookie\'si temizlendi');
    }
    
    // Siparişi cookie'ye kaydet
    saveOrderToCookie(order) {
        try {
            // Mevcut siparişleri al
            let orders = this.getOrdersFromCookie();
            orders.push(order);
            
            // Son 10 siparişi tut
            if (orders.length > 10) {
                orders = orders.slice(-10);
            }
            
            const ordersData = JSON.stringify(orders);
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); // 30 gün geçerli
            
            document.cookie = `orders=${encodeURIComponent(ordersData)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
            console.log('✅ Sipariş cookie\'ye kaydedildi:', order);
        } catch (error) {
            console.error('❌ Sipariş cookie\'ye kaydedilirken hata:', error);
        }
    }
    
    // Cookie'den siparişleri al
    getOrdersFromCookie() {
        try {
            const cookies = document.cookie.split(';');
            const ordersCookie = cookies.find(cookie => cookie.trim().startsWith('orders='));
            
            if (ordersCookie) {
                const ordersData = decodeURIComponent(ordersCookie.split('=')[1]);
                const orders = JSON.parse(ordersData);
                
                // Veri doğrulama
                if (Array.isArray(orders)) {
                    return orders;
                }
            }
            
            return [];
        } catch (error) {
            console.error('❌ Cookie\'den siparişler yüklenirken hata:', error);
            return [];
        }
    }
    
    // Tüm siparişleri getir (debug/görüntüleme için)
    getAllOrders() {
        return this.getOrdersFromCookie();
    }
    
    // Cookie boyut kontrolü
    checkCookieSize() {
        const allCookies = document.cookie;
        const sizeInKB = new Blob([allCookies]).size / 1024;
        
        if (sizeInKB > 3) { // 3KB üzeri uyarı
            console.warn(`⚠️ Cookie boyutu büyük: ${sizeInKB.toFixed(2)}KB`);
        }
        
        return sizeInKB;
    }
    getCart() {
        return this.cart;
    }
    
    // ✅ SEPET DURUMU
    isEmpty() {
        return this.cart.items.length === 0;
    }
    
    // ✅ TOPLAM ÜRÜN SAYISI
    getTotalItems() {
        return this.cart.itemCount;
    }
    
    // ✅ TOPLAM TUTAR
    getTotalAmount() {
        return this.cart.total;
    }
}

// Global CartManager instance
let cartManager;

$(document).ready(() => {
    cartManager = new CartManager();
    window.cartManager = cartManager; // Debug için
    console.log('✅ CartManager hazır');
});