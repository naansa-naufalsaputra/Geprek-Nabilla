export const trackEvent = (eventName, payload = {}) => {
    const eventPayload = {
        ...payload,
        timestamp: new Date().toISOString()
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...eventPayload });

    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload);
    }
};
