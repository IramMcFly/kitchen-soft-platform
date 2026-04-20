import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { getPlanByPriceId } from '@/lib/plans';
import { getPlanCapabilities, normalizeCloudPlan } from '@/lib/cloud-plan';
import {
    getCloudProfileByStripeCustomerId,
    updateCloudProfileById,
    upsertCloudProfile,
} from '@/lib/cloud-profile';

async function updateSupabaseProfileFromSubscription(input: {
    userId: string;
    customerId?: string | null;
    subscriptionId?: string | null;
    subscriptionStatus?: string | null;
    plan?: string | null;
}) {
    const normalizedPlan = normalizeCloudPlan(input.plan || 'FREE');
    const capabilities = getPlanCapabilities(normalizedPlan);

    try {
        await updateCloudProfileById(input.userId, {
            plan: normalizedPlan,
            cloudSyncEnabled: capabilities.cloudSyncEnabled,
            stripeCustomerId: input.customerId ?? null,
            stripeSubscriptionId: input.subscriptionId ?? null,
            stripeSubscriptionStatus: input.subscriptionStatus ?? null,
        });
    } catch {
        await upsertCloudProfile({
            id: input.userId,
            plan: normalizedPlan,
            cloudSyncEnabled: capabilities.cloudSyncEnabled,
            stripeCustomerId: input.customerId ?? null,
            stripeSubscriptionId: input.subscriptionId ?? null,
            stripeSubscriptionStatus: input.subscriptionStatus ?? null,
        });
    }
}

export async function POST(req: Request) {
    let stripe;
    try {
        stripe = getStripeClient();
    } catch {
        return new NextResponse('Stripe is not configured', { status: 503 });
    }

    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as any;

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const userId = String(session?.metadata?.userId || '');

        if (!userId) {
            return new NextResponse('User id is required', { status: 400 });
        }

        await updateSupabaseProfileFromSubscription({
            userId,
            customerId: String(subscription.customer || ''),
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            plan: session?.metadata?.plan || 'FREE',
        });
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const customerId = typeof invoice.customer === 'string'
                ? invoice.customer
                : invoice.customer?.id;

            if (customerId) {
                const profile = await getCloudProfileByStripeCustomerId(customerId);

                if (profile) {
                    await updateCloudProfileById(profile.id, {
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscription.id,
                        stripeSubscriptionStatus: subscription.status,
                    });
                }
            }
        }
    }

    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const customerId = typeof invoice.customer === 'string'
                ? invoice.customer
                : invoice.customer?.id;

            if (customerId) {
                const profile = await getCloudProfileByStripeCustomerId(customerId);

                if (profile) {
                    await updateCloudProfileById(profile.id, {
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscription.id,
                        stripeSubscriptionStatus: subscription.status,
                    });
                }
            }
        }
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as any;
        const priceId = subscription.items.data[0].price.id;
        const planFromPrice = getPlanByPriceId(priceId);
        const plan = planFromPrice || subscription.metadata?.plan;

        const customerId = typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        if (customerId) {
            const profile = await getCloudProfileByStripeCustomerId(customerId);

            if (profile) {
                const updateData: any = {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscription.id,
                    stripeSubscriptionStatus: subscription.status,
                };

                if (plan) {
                    const normalizedPlan = normalizeCloudPlan(plan);
                    updateData.plan = normalizedPlan;
                    updateData.cloudSyncEnabled = getPlanCapabilities(normalizedPlan).cloudSyncEnabled;
                }

                await updateCloudProfileById(profile.id, updateData);
            }
        }
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as any;

        const customerId = typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        if (customerId) {
            const profile = await getCloudProfileByStripeCustomerId(customerId);

            if (profile) {
                await updateCloudProfileById(profile.id, {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscription.id,
                    stripeSubscriptionStatus: subscription.status,
                    plan: 'FREE',
                    cloudSyncEnabled: false,
                });
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
