import { NextResponse, NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getToken } from 'next-auth/jwt';

const PLANS = {
    'MINI': {
        name: 'Plan Mini',
        amount: 10000, // $100.00 MXN
    },
    'MEDIUM': {
        name: 'Plan Medium',
        amount: 30000, // $300.00 MXN
    }
};

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { plan } = body;

        if (!plan || !PLANS[plan as keyof typeof PLANS]) {
            return new NextResponse('Invalid Plan', { status: 400 });
        }

        const planData = PLANS[plan as keyof typeof PLANS];

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: `Kitchen Soft POS - ${planData.name}`,
                            description: 'Suscripción Mensual',
                        },
                        unit_amount: planData.amount,
                        recurring: {
                            interval: 'month',
                        },
                    },
                },
            ],
            metadata: {
                userId: token.id as string,
                plan: plan,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
            customer_email: token.email as string,
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.log('[STRIPE_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
