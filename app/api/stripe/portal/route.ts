import { NextResponse, NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { getCloudProfileById, updateCloudProfileById } from '@/lib/cloud-profile';

export async function POST(req: NextRequest) {
    try {
        const stripe = getStripeClient();
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const profile = await getCloudProfileById(identity.userId);
        if (!profile || !profile.stripe_customer_id) {
            return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
        }

        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: profile.stripe_customer_id,
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            });

            return NextResponse.json({ url: session.url });
        } catch (error: any) {
            if (error?.code === 'resource_missing' && error?.param === 'customer') {
                await updateCloudProfileById(identity.userId, {
                    plan: 'FREE',
                    cloudSyncEnabled: false,
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                    stripeSubscriptionStatus: null,
                });

                return NextResponse.json({ url: '/#pricing?error=subscription_sync_issue' });
            }

            throw error;
        }

    } catch (error: any) {
        if (error?.message === 'STRIPE_SECRET_KEY is not configured') {
            return NextResponse.json({ error: 'Stripe no está configurado' }, { status: 503 });
        }

        console.log('[STRIPE_PORTAL_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
