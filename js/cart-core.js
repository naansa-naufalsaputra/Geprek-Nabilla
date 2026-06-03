export const buildUniqueCartId = (itemId, optionsArr) => {
    return `${itemId}-${optionsArr.join('-').replace(/\\s+/g, '')}`;
};

export const addToCart = ({ cart, itemId, name, price, quantity, options }) => {
    const nextCart = { ...cart };
    const uniqueId = buildUniqueCartId(itemId, options);

    if (nextCart[uniqueId]) {
        nextCart[uniqueId] = {
            ...nextCart[uniqueId],
            qty: nextCart[uniqueId].qty + quantity
        };
    } else {
        nextCart[uniqueId] = {
            name,
            price,
            qty: quantity,
            options
        };
    }

    return nextCart;
};

export const changeQty = ({ cart, id, delta }) => {
    if (!cart[id]) return cart;

    const nextCart = { ...cart };
    const nextQty = nextCart[id].qty + delta;
    if (nextQty <= 0) {
        delete nextCart[id];
    } else {
        nextCart[id] = {
            ...nextCart[id],
            qty: nextQty
        };
    }
    return nextCart;
};

export const getCartSummary = (cart) => {
    let totalItems = 0;
    let totalPrice = 0;

    Object.keys(cart).forEach((id) => {
        const item = cart[id];
        totalItems += item.qty;
        totalPrice += (item.price * item.qty);
    });

    return { totalItems, totalPrice };
};
