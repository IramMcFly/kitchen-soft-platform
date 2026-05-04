import { NextResponse, NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { PLANS } from '@/lib/plans';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { getCloudProfileById } from '@/lib/cloud-profile';

export async function POST(req: NextRequest) {
    try {
        const stripe = getStripeClient();
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { plan } = body;

        if (!plan || !PLANS[plan as keyof typeof PLANS]) {
            return NextResponse.json({ error: 'Invalid Plan' }, { status: 400 });
        }

        const planData = PLANS[plan as keyof typeof PLANS];

        if (!planData.priceId) {
            return NextResponse.json(
                { error: 'El precio del plan PRO no está configurado en Stripe' },
                { status: 503 }
            );
        }

        let customer: string | undefined;
        let customerEmail: string | undefined;

        const profile = await getCloudProfileById(identity.userId);
        customer = profile?.stripe_customer_id || undefined;
        customerEmail = profile?.email || identity.email;

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    quantity: 1,
                    price: planData.priceId,
                },
            ],
            metadata: {
                userId: identity.userId,
                plan: plan,
                restaurantName: profile?.restaurant_name || identity.restaurantName || 'Mi Restaurante',
                userName: profile?.name || identity.name || 'Cliente',
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
            customer,
            customer_email: customer ? undefined : (customerEmail || undefined),
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'STRIPE_SECRET_KEY is not configured') {
            return NextResponse.json({ error: 'Stripe no está configurado' }, { status: 503 });
        }

        console.log('[STRIPE_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
