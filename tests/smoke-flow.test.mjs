import test from 'node:test';
import assert from 'node:assert/strict';

import { addToCart, changeQty, getCartSummary } from '../js/cart-core.js';
import { buildWhatsAppMessage, buildDefaultWaLink } from '../js/whatsapp.js';

test('smoke flow: add items, adjust qty, build whatsapp message', () => {
    let cart = {};

    cart = addToCart({
        cart,
        itemId: 'geprek',
        name: 'Ayam Geprek',
        price: 13000,
        quantity: 2,
        options: ['Lvl 2', 'Pake Nasi']
    });

    cart = addToCart({
        cart,
        itemId: 'teh',
        name: 'Es Teh',
        price: 3000,
        quantity: 1,
        options: ['Less Sugar']
    });

    const geprekKey = Object.keys(cart).find((key) => key.startsWith('geprek-'));
    assert.ok(geprekKey, 'Geprek item harus ada di cart');

    cart = changeQty({ cart, id: geprekKey, delta: 1 });

    const summary = getCartSummary(cart);
    assert.equal(summary.totalItems, 4);
    assert.equal(summary.totalPrice, 42000);

    const fixedDate = new Date('2026-06-03T10:30:00+07:00');
    const message = buildWhatsAppMessage({
        cart,
        waGreeting: 'Hallo Mak',
        currency: 'id-ID',
        orderType: 'Pickup',
        note: 'Tanpa sambal untuk 1 porsi',
        now: fixedDate
    });

    assert.match(message, /Hallo Mak, saya ingin memesan:/);
    assert.match(message, /Ayam Geprek/);
    assert.match(message, /Es Teh/);
    assert.match(message, /\*Total Akhir: Rp 42\.000\*/);
    assert.match(message, /Metode: \*Pickup\*/);
    assert.match(message, /Catatan: Tanpa sambal untuk 1 porsi/);
});

test('smoke flow: default WA link should point to configured number', () => {
    const link = buildDefaultWaLink({
        waNumber: '6285865289638',
        waGreeting: 'Hallo Mak'
    });

    assert.ok(link.startsWith('https://wa.me/6285865289638?text='));
    assert.ok(link.includes('Hallo%20Mak'));
});
