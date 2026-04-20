import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    if (!stripeClient) {
        stripeClient = new Stripe(secretKey, {
            apiVersion: '2026-01-28.clover',
            typescript: true,
        });
    }

    return stripeClient;
}
