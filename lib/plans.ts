export const PRO_MONTHLY_PRICE_USD = 25;

export const PLANS = {
    PRO: {
        name: 'Plan PRO',
        monthlyPriceUsd: PRO_MONTHLY_PRICE_USD,
        priceId: process.env.STRIPE_PRICE_ID_PRO || '',
    },
};

export function getPlanByPriceId(priceId: string): string | null {
    const knownPriceIds = [
        PLANS.PRO.priceId,
    ].filter(Boolean);

    if (knownPriceIds.includes(priceId)) {
        return 'PRO';
    }

    return null;
}
