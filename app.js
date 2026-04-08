/* 
  Geprek Nabilla - Interactions & State Management (v2 - Customization)
*/

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. UI Reveal & Scroll ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const elementVisible = 150;
            if (elementTop < windowHeight - elementVisible) {
                el.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // --- 2. Cart & Customization State ---
    let cart = {}; // key: unique_id, value: {name, price, qty, options}
    let pendingItem = null; // Stores item temporarily during customization
    
    // DOM Elements
    const floatingCart = document.getElementById('floating-cart');
    const cartBadge = document.getElementById('cart-badge');
    const cartOverlay = document.getElementById('cart-modal-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Customization Modal Elements
    const customOverlay = document.getElementById('custom-modal-overlay');
    const closeCustomBtn = document.getElementById('close-custom-btn');
    const customItemName = document.getElementById('custom-item-name');
    const customOptionsContainer = document.getElementById('custom-options-container');
    const confirmAddBtn = document.getElementById('confirm-add-btn');

    // Utility: Format Rupiah
    const formatRp = (num) => {
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    // Render Cart UI
    const updateCartUI = () => {
        let totalItems = 0;
        let totalPrice = 0;
        let itemsHtml = '';

        Object.keys(cart).forEach(id => {
            const item = cart[id];
            totalItems += item.qty;
            totalPrice += (item.price * item.qty);

            const optionsText = item.options.length > 0 ? `<div class="cart-item-options">${item.options.join(', ')}</div>` : '';

            itemsHtml += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        ${optionsText}
                        <div class="cart-item-price">${formatRp(item.price * item.qty)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn minus" data-id="${id}">-</button>
                        <span style="font-weight: 800; min-width: 20px; text-align: center;">${item.qty}</span>
                        <button class="qty-btn plus" data-id="${id}">+</button>
                    </div>
                </div>
            `;
        });

        cartBadge.innerText = totalItems;
        cartTotalPrice.innerText = formatRp(totalPrice);
        
        if (totalItems > 0) {
            floatingCart.style.display = 'flex';
        } else {
            floatingCart.style.display = 'none';
            if (cartOverlay.classList.contains('active')) cartOverlay.classList.remove('active');
        }

        if (totalItems === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Keranjang Anda masih kosong.</div>';
        } else {
            cartItemsContainer.innerHTML = itemsHtml;
            document.querySelectorAll('.qty-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const change = e.target.classList.contains('plus') ? 1 : -1;
                    changeQty(id, change);
                });
            });
        }
    };

    // Open Customization Modal
    const openCustomModal = (id, name, price, category) => {
        pendingItem = { id, name, price: parseInt(price), category, selectedOptions: {} };
        customItemName.innerText = `Kustomisasi ${name}`;
        
        let html = '';
        if (category === 'makanan') {
            // Level Pedas (0-5)
            html += `
                <div class="choice-group">
                    <label class="choice-label">Level Pedas (0 - 5)</label>
                    <div class="choice-chips" data-key="pedas">
                        ${[0,1,2,3,4,5].map(lvl => `<div class="choice-chip ${lvl === 0 ? 'active' : ''}" data-value="Lvl ${lvl}">${lvl}</div>`).join('')}
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
            // Level Gula
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

        customOptionsContainer.innerHTML = html;
        
        // Add click events to chips
        document.querySelectorAll('.choice-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const group = e.target.closest('.choice-chips');
                const key = group.getAttribute('data-key');
                const val = e.target.getAttribute('data-value');
                
                // Update UI visually
                group.querySelectorAll('.choice-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update state
                pendingItem.selectedOptions[key] = val;
                
                // Handle price addition (for rice)
                const addPrice = e.target.getAttribute('data-add-price');
                if (addPrice && key === 'nasi') {
                    pendingItem.extraPrice = parseInt(addPrice);
                } else if (key === 'nasi') {
                    pendingItem.extraPrice = 0;
                }
            });
        });

        customOverlay.classList.add('active');
    };

    const confirmAddToCart = () => {
        if (!pendingItem) return;

        const optionsArr = Object.values(pendingItem.selectedOptions);
        const finalPrice = pendingItem.price + (pendingItem.extraPrice || 0);
        
        // Generate unique ID based on options to separate variants
        const uniqueId = `${pendingItem.id}-${optionsArr.join('-').replace(/\s+/g, '')}`;

        if (cart[uniqueId]) {
            cart[uniqueId].qty++;
        } else {
            cart[uniqueId] = { 
                name: pendingItem.name, 
                price: finalPrice, 
                qty: 1,
                options: optionsArr
            };
        }

        updateCartUI();
        customOverlay.classList.remove('active');
        pendingItem = null;

        // Feedback
        floatingCart.style.transform = 'scale(1.2)';
        setTimeout(() => floatingCart.style.transform = '', 200);
    };

    const changeQty = (id, delta) => {
        if (!cart[id]) return;
        cart[id].qty += delta;
        if (cart[id].qty <= 0) delete cart[id];
        updateCartUI();
    };

    // --- 3. Event Listeners ---
    
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const el = e.currentTarget;
            openCustomModal(
                el.getAttribute('data-id'),
                el.getAttribute('data-name'),
                el.getAttribute('data-price'),
                el.getAttribute('data-category')
            );
        });
    });

    confirmAddBtn.addEventListener('click', confirmAddToCart);
    closeCustomBtn.addEventListener('click', () => customOverlay.classList.remove('active'));

    floatingCart.addEventListener('click', () => cartOverlay.classList.add('active'));
    closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));

    // Checkout via WhatsApp
    checkoutBtn.addEventListener('click', () => {
        let totalItems = 0;
        let totalPrice = 0;
        let message = `Halo Geprek Nabilla, saya pesen dong:\n\n`;
        
        Object.keys(cart).forEach(id => {
            const item = cart[id];
            totalItems += item.qty;
            const subtotal = item.price * item.qty;
            totalPrice += subtotal;
            
            const optionsStr = item.options.length > 0 ? ` [${item.options.join(', ')}]` : '';
            message += `- ${item.qty}x ${item.name}${optionsStr} (${formatRp(subtotal)})\n`;
        });
        
        if (totalItems === 0) return;
        message += `\n*Total: ${formatRp(totalPrice)}*\n\nMohon info total dan ongkirnya ya!`;

        const waNumber = '6280000000000'; // Placeholder
        const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
    });

    updateCartUI();
});
