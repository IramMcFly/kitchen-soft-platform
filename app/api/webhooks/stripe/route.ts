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

    return new NextResponse(null, { status: 200 });
}
