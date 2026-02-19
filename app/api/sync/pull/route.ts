import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import RemoteProduct from '@/models/RemoteProduct';
import RemoteTable from '@/models/RemoteTable';
import RemoteSession from '@/models/RemoteSession';
import RemoteOrder from '@/models/RemoteOrder';

export async function GET(req: NextRequest) {
    try {
        // 1. Auth Validation
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

        let userId: string;

        try {
            const payload = await jwtVerify(token, secret);
            userId = payload.payload.userId as string;
        } catch (err) {
            return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ message: 'Usuario no identificado' }, { status: 401 });
        }

        await dbConnect();

        // 2. Fetch all data
        const [products, tables, sessions, orders] = await Promise.all([
            RemoteProduct.find({ userId }).lean(),
            RemoteTable.find({ userId }).lean(),
            RemoteSession.find({ userId }).lean(),
            RemoteOrder.find({ userId }).lean()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                products,
                tables,
                sessions,
                orders
            },
            timestamp: new Date()
        });

    } catch (error: any) {
        console.error('Restore error:', error);
        return NextResponse.json(
            { message: error.message || 'Error interno al restaurar datos' },
            { status: 500 }
        );
    }
}
