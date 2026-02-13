import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
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

        if (!session?.metadata?.userId) {
            return new NextResponse('User id is required', { status: 400 });
        }

        await dbConnect();

        // Map price/product ID to plan name
        // Ideally we store the price ID in the ENV or DB
        // For now we will assume the metadata contains the plan name
        const plan = session?.metadata?.plan;

        await User.findByIdAndUpdate(session.metadata.userId, {
            stripeCustomerId: subscription.customer as string,
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            plan: plan || 'FREE', // Default to FREE if something goes wrong, but should not happen
        });
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await dbConnect();
            await User.findOneAndUpdate({ subscriptionId: subscription.id }, {
                subscriptionStatus: subscription.status,
            });
        }
    }

    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await dbConnect();
            await User.findOneAndUpdate({ subscriptionId: subscription.id }, {
                subscriptionStatus: subscription.status, // e.g. 'past_due'
            });
        }
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as any;
        await dbConnect();

        // If the update is a cancellation (cancel_at_period_end = true), status might still be active
        // If the update involves a plan change, we need to map the new Price ID to a Plan Name
        // Ideally, we'd have a mapping. For now, we'll try to get it from metadata if present on the subscription
        // IF NOT present, we might be in trouble for upgrades. 
        // Strategy: Check subscription.items.data[0].price.product metadata if possible? 
        // For simplicity and safety, let's update status. If plan changed, we ideally need that info.

        // Try to find the plan name from metadata on the subscription object itself
        const plan = subscription.metadata?.plan;

        const updateData: any = {
            subscriptionStatus: subscription.status,
        };

        if (plan) {
            updateData.plan = plan;
        }

        await User.findOneAndUpdate({ subscriptionId: subscription.id }, updateData);
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as any;
        await dbConnect();

        // Subscription canceled/deleted -> Revert to FREE
        await User.findOneAndUpdate({ subscriptionId: subscription.id }, {
            subscriptionStatus: subscription.status, // 'canceled'
            plan: 'FREE',
        });
    }

    return new NextResponse(null, { status: 200 });
}
