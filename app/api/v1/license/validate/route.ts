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
                return NextResponse.json({ message: 'Licencia suspendida o usuario no encontrado' }, { status: 403 });
            }

            return NextResponse.json({
                valid: true,
                message: 'Licencia activa',
                license: {
                    plan: payload.plan,
                    restaurantName: payload.restaurantName,
                    role: payload.role,
                    expiresAt: payload.exp
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
