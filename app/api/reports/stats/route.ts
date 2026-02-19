import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import RemoteOrder from '@/models/RemoteOrder';
import RemoteProduct from '@/models/RemoteProduct';
import RemoteTable from '@/models/RemoteTable';
import RemoteSession from '@/models/RemoteSession';
import dbConnect from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !token.sub) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = token.sub;
        await dbConnect();

        // Calcular estadísticas
        const [
            productsCount,
            tablesCount,
            sessionsCount,
            ordersCount,
            totalSalesResult
        ] = await Promise.all([
            RemoteProduct.countDocuments({ userId }),
            RemoteTable.countDocuments({ userId }),
            RemoteSession.countDocuments({ userId }),
            RemoteOrder.countDocuments({ userId }),
            RemoteOrder.aggregate([
                { $match: { userId } },
                { $group: { _id: null, total: { $sum: '$totales.total' } } }
            ])
        ]);

        const totalSales = totalSalesResult[0]?.total || 0;

        return NextResponse.json({
            stats: {
                products: productsCount,
                tables: tablesCount,
                sessions: sessionsCount,
                orders: ordersCount,
                totalSales
            }
        });

    } catch (error) {
        console.error('Stats Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
