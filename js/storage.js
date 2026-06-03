export const loadCartFromStorage = (storageKey) => {
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
        }
    } catch (error) {
        console.warn('Gagal memuat cart dari localStorage:', error);
    }
    return {};
};

export const saveCartToStorage = (storageKey, cart) => {
    try {
        window.localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
        console.warn('Gagal menyimpan cart ke localStorage:', error);
    }
};
