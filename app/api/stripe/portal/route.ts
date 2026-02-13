import { NextResponse, NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    let token;
    try {
        token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(token.id);

        if (!user || !user.stripeCustomerId) {
            return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.log('[STRIPE_PORTAL_POST]', error);

        // Handle case where Customer ID exists in DB but not in Stripe (e.g. deleted in dashboard or env mismatch)
        if (error?.code === 'resource_missing' && error?.param === 'customer' && token?.id) {
            try {
                // Reset user data so they can re-subscribe
                await dbConnect();
                // Perform a hard reset of subscription fields
                await User.findByIdAndUpdate(token.id, {
                    $unset: {
                        stripeCustomerId: 1,
                        subscriptionId: 1,
                        subscriptionStatus: 1
                    },
                    $set: { plan: 'FREE' }
                });

                // Return a redirect URL to pricing so the frontend handles it gracefully
                return NextResponse.json({ url: '/#pricing?error=subscription_sync_issue' });
            } catch (dbError) {
                console.error('Error reseting user data:', dbError);
            }
        }

        return new NextResponse('Internal Error', { status: 500 });
    }
}
