export const PLANS = {
    'MINI': {
        name: 'Plan Mini',
        priceId: process.env.STRIPE_PRICE_ID_MINI || 'price_1SwpMoApJI5Yqh9XKccZYHvq',
    },
    'MEDIUM': {
        name: 'Plan Medium',
        priceId: process.env.STRIPE_PRICE_ID_MEDIUM || 'price_1T0DUxApJI5Yqh9XeYyKfLl4',
    }
};

export function getPlanByPriceId(priceId: string): string | null {
    for (const [key, value] of Object.entries(PLANS)) {
        if (value.priceId === priceId) {
            return key;
        }
    }
    return null;
}
