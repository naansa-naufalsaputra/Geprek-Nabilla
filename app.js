/*
  Geprek Nabilla - Interactions & State Management (v4.0 modular)
*/

import { APP_CONFIG } from './js/config.js';
import { trackEvent } from './js/analytics.js';
import { loadCartFromStorage, saveCartToStorage } from './js/storage.js';
import { addToCart, changeQty, getCartSummary } from './js/cart-core.js';
import { formatRp, formatWaDisplayNumber, buildDefaultWaLink, buildWhatsAppMessage } from './js/whatsapp.js';

document.addEventListener('DOMContentLoaded', () => {
    let cart = loadCartFromStorage(APP_CONFIG.storageCartKey);
    let pendingItem = null;
    let modalQuantity = 1;

    const revealElements = document.querySelectorAll('.reveal');
    const waCtaLinks = document.querySelectorAll('[data-wa-cta]');

    const floatingCart = document.getElementById('floating-cart');
    const cartBadge = document.getElementById('cart-badge');
    const cartOverlay = document.getElementById('cart-modal-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const orderTypeSelect = document.getElementById('order-type');
    const orderNoteInput = document.getElementById('order-note');

    const customOverlay = document.getElementById('custom-modal-overlay');
    const closeCustomBtn = document.getElementById('close-custom-btn');
    const customItemName = document.getElementById('custom-item-name');
    const customOptionsContainer = document.getElementById('custom-options-container');
    const confirmAddBtn = document.getElementById('confirm-add-btn');
    const waContactNumberText = document.getElementById('wa-contact-number');

    const syncWhatsAppCTA = () => {
        const href = buildDefaultWaLink({
            waNumber: APP_CONFIG.waNumber,
            waGreeting: APP_CONFIG.waGreeting
        });

        waCtaLinks.forEach((link) => {
            link.setAttribute('href', href);
        });

        if (waContactNumberText) {
            waContactNumberText.textContent = formatWaDisplayNumber(APP_CONFIG.waNumber);
        }
    };

    const persistCart = () => {
        saveCartToStorage(APP_CONFIG.storageCartKey, cart);
    };

    const refreshCartUI = () => {
        if (!cartBadge || !cartTotalPrice || !cartItemsContainer || !floatingCart) return;

        let totalItems = 0;
        let totalPrice = 0;
        let itemsHtml = '';

        Object.keys(cart).forEach((id) => {
            const item = cart[id];
            totalItems += item.qty;
            totalPrice += (item.price * item.qty);

            const optionsText = item.options.length > 0
                ? `<div class="cart-item-options" style="font-size: 0.8rem; opacity: 0.7;">${item.options.join(', ')}</div>`
                : '';

            itemsHtml += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        ${optionsText}
                        <div class="cart-item-price">${formatRp(item.price * item.qty, APP_CONFIG.currency)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn minus" aria-label="Kurangi jumlah item" data-id="${id}">-</button>
                        <span style="font-weight: 800; min-width: 20px; text-align: center;">${item.qty}</span>
                        <button class="qty-btn plus" aria-label="Tambah jumlah item" data-id="${id}">+</button>
                    </div>
                </div>
            `;
        });

        cartBadge.innerText = totalItems;
        cartTotalPrice.innerText = formatRp(totalPrice, APP_CONFIG.currency);
        floatingCart.style.display = totalItems > 0 ? 'flex' : 'none';

        if (totalItems === 0 && cartOverlay.classList.contains('active')) {
            cartOverlay.classList.remove('active');
        }

        if (totalItems === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Keranjang Anda masih kosong.</div>';
        } else {
            cartItemsContainer.innerHTML = itemsHtml;
            cartItemsContainer.querySelectorAll('.qty-btn').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const delta = e.currentTarget.classList.contains('plus') ? 1 : -1;
                    cart = changeQty({ cart, id, delta });
                    persistCart();
                    refreshCartUI();

                    const summary = getCartSummary(cart);
                    trackEvent('update_cart_qty', {
                        total_items: summary.totalItems,
                        total_price: summary.totalPrice
                    });
                });
            });
        }
    };

    const renderCustomizationModal = (id, name, price, category) => {
        if (!customItemName || !customOptionsContainer || !customOverlay) return;

        pendingItem = { id, name, price: Number.parseInt(price, 10), category, selectedOptions: {} };
        modalQuantity = 1;
        customItemName.innerText = `Kustomisasi ${name}`;

        let html = '';
        if (category === 'makanan') {
            html += `
                <div class="choice-group">
                    <label class="choice-label">Level Pedas (0 - 5)</label>
                    <div class="choice-chips" data-key="pedas">
                        ${[0, 1, 2, 3, 4, 5].map((lvl) => `<div class="choice-chip ${lvl === 0 ? 'active' : ''}" data-value="Lvl ${lvl}">${lvl}</div>`).join('')}
                    </div>
                </div>
                <div class="choice-group">
                    <label class="choice-label">Pilihan Nasi</label>
                    <div class="choice-chips" data-key="nasi">
                        <div class="choice-chip" data-value="Tanpa Nasi (-3rb)" data-add-price="-3000">Tanpa Nasi</div>
                        <div class="choice-chip active" data-value="Pake Nasi">Pake Nasi</div>
                    </div>
                </div>
            `;
            pendingItem.selectedOptions.pedas = 'Lvl 0';
            pendingItem.selectedOptions.nasi = 'Pake Nasi';
            pendingItem.extraPrice = 0;
        } else if (category === 'minuman') {
            html += `
                <div class="choice-group">
                    <label class="choice-label">Tingkat Manis</label>
                    <div class="choice-chips" data-key="gula">
                        <div class="choice-chip active" data-value="Gula Normal">Normal</div>
                        <div class="choice-chip" data-value="Less Sugar">Less Sugar</div>
                        <div class="choice-chip" data-value="No Sugar">No Sugar</div>
                    </div>
                </div>
            `;
            pendingItem.selectedOptions.gula = 'Gula Normal';
        }

        html += `
            <div class="choice-group">
                <label class="choice-label">Jumlah Pesanan</label>
                <div class="qty-selector">
                    <button type="button" class="qty-btn modal-minus" aria-label="Kurangi jumlah">-</button>
                    <div class="qty-value" id="modal-qty-val">1</div>
                    <button type="button" class="qty-btn modal-plus" aria-label="Tambah jumlah">+</button>
                </div>
            </div>
        `;

        customOptionsContainer.innerHTML = html;

        const modalQtyVal = document.getElementById('modal-qty-val');
        customOptionsContainer.querySelector('.modal-minus').addEventListener('click', () => {
            if (modalQuantity > 1) {
                modalQuantity -= 1;
                modalQtyVal.innerText = modalQuantity;
            }
        });

        customOptionsContainer.querySelector('.modal-plus').addEventListener('click', () => {
            modalQuantity += 1;
            modalQtyVal.innerText = modalQuantity;
        });

        customOptionsContainer.querySelectorAll('.choice-chip').forEach((chip) => {
            chip.setAttribute('role', 'button');
            chip.setAttribute('tabindex', '0');

            chip.addEventListener('click', (e) => {
                const group = e.currentTarget.closest('.choice-chips');
                const key = group.getAttribute('data-key');
                const val = e.currentTarget.getAttribute('data-value');

                group.querySelectorAll('.choice-chip').forEach((c) => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                pendingItem.selectedOptions[key] = val;

                const addPrice = e.currentTarget.getAttribute('data-add-price');
                if (addPrice && key === 'nasi') {
                    pendingItem.extraPrice = Number.parseInt(addPrice, 10);
                } else if (key === 'nasi') {
                    pendingItem.extraPrice = 0;
                }
            });

            chip.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                }
            });
        });

        customOverlay.classList.add('active');
        trackEvent('open_customization', { item_id: id, category });
    };

    const confirmAddToCart = () => {
        if (!pendingItem) return;

        const options = Object.values(pendingItem.selectedOptions);
        const finalPrice = pendingItem.price + (pendingItem.extraPrice || 0);

        cart = addToCart({
            cart,
            itemId: pendingItem.id,
            name: pendingItem.name,
            price: finalPrice,
            quantity: modalQuantity,
            options
        });

        persistCart();
        refreshCartUI();
        customOverlay.classList.remove('active');

        trackEvent('add_to_cart', {
            item_id: pendingItem.id,
            item_name: pendingItem.name,
            category: pendingItem.category,
            quantity: modalQuantity,
            unit_price: finalPrice
        });

        pendingItem = null;

        if (floatingCart) {
            floatingCart.style.transform = 'scale(1.2)';
            setTimeout(() => {
                floatingCart.style.transform = '';
            }, 200);
        }
    };

    const initRevealAnimation = () => {
        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            revealElements.forEach((el) => revealObserver.observe(el));
        } else {
            revealElements.forEach((el) => el.classList.add('active'));
        }
    };

    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', function onAnchorClick(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        });
    };

    document.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const el = e.currentTarget;
            renderCustomizationModal(
                el.getAttribute('data-id'),
                el.getAttribute('data-name'),
                el.getAttribute('data-price'),
                el.getAttribute('data-category')
            );
        });
    });

    if (confirmAddBtn) confirmAddBtn.addEventListener('click', confirmAddToCart);
    if (closeCustomBtn) closeCustomBtn.addEventListener('click', () => customOverlay.classList.remove('active'));

    if (floatingCart) {
        floatingCart.addEventListener('click', () => {
            cartOverlay.classList.add('active');
            trackEvent('open_cart');
        });

        floatingCart.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                cartOverlay.classList.add('active');
                trackEvent('open_cart');
            }
        });
    }

    if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));

    if (cartOverlay) {
        cartOverlay.addEventListener('click', (event) => {
            if (event.target === cartOverlay) cartOverlay.classList.remove('active');
        });
    }

    if (customOverlay) {
        customOverlay.addEventListener('click', (event) => {
            if (event.target === customOverlay) customOverlay.classList.remove('active');
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            cartOverlay.classList.remove('active');
            customOverlay.classList.remove('active');
        }
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const summary = getCartSummary(cart);
            if (summary.totalItems === 0) return;

            const message = buildWhatsAppMessage({
                cart,
                waGreeting: APP_CONFIG.waGreeting,
                currency: APP_CONFIG.currency,
                orderType: orderTypeSelect ? orderTypeSelect.value : 'Delivery',
                note: orderNoteInput ? orderNoteInput.value.trim() : ''
            });

            const waLink = `https://wa.me/${APP_CONFIG.waNumber}?text=${encodeURIComponent(message)}`;

            trackEvent('checkout_whatsapp', {
                total_items: summary.totalItems,
                total_price: summary.totalPrice
            });

            window.open(waLink, '_blank');
        });
    }

    syncWhatsAppCTA();
    waCtaLinks.forEach((link) => {
        link.addEventListener('click', () => trackEvent('click_wa_cta'));
    });

    initRevealAnimation();
    initSmoothScroll();
    refreshCartUI();
    trackEvent('page_view_home');
});
