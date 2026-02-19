import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Token no proporcionado' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

        try {
            const { payload } = await jwtVerify(token, secret);

            // Check if user is still active in DB
            await dbConnect();
            const user = await User.findById(payload.userId);

            if (!user || user.isActive === false) {
                console.warn('License check failed: User not found or inactive', payload.userId);
                return NextResponse.json({ message: 'Licencia suspendida o usuario no encontrado' }, { status: 403 });
            }

            console.log('License Check for user:', user.email, 'Plan:', user.plan);

            const PLANS_LIMITS: any = {
                'FREE': {
                    admins: 1,
                    tables: 4,
                    registers: 1,
                    cashiers: 1,
                    cooks: 1,
                    waiters: 2,
                },
                'MINI': {
                    admins: 2,
                    tables: 8,
                    registers: 1,
                    cashiers: 2,
                    cooks: 2,
                    waiters: 2,
                },
                'MEDIUM': {
                    admins: 4,
                    tables: 20,
                    registers: 2,
                    cashiers: 4,
                    cooks: 8,
                    waiters: 12,
                }
            };

            const userPlan = user.plan || 'FREE';
            const limits = PLANS_LIMITS[userPlan];

            return NextResponse.json({
                valid: true,
                message: 'Licencia activa',
                license: {
                    plan: userPlan,
                    restaurantName: user.restaurantName || payload.restaurantName,
                    role: user.role || payload.role,
                    expiresAt: payload.exp,
                    limits: limits
                }
            });
        } catch (err) {
            return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 });
        }

    } catch (error: any) {
        console.error('License Validation Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor', error: error.message },
            { status: 500 }
        );
    }
}
