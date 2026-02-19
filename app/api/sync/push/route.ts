import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import RemoteProduct from '@/models/RemoteProduct';
import RemoteTable from '@/models/RemoteTable';
import RemoteSession from '@/models/RemoteSession';
import RemoteOrder from '@/models/RemoteOrder';

export async function POST(req: NextRequest) {
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
            const { payload } = await jwtVerify(token, secret);
            userId = payload.userId as string;
        } catch (err) {
            return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
        }

        // 2. Process Payload
        const body = await req.json();
        const { products, tables, sessions, orders } = body;

        await dbConnect();

        const results = {
            products: 0,
            tables: 0,
            sessions: 0,
            orders: 0
        };

        // 3. Bulk Writes using replaceOne with upsert
        // Products
        if (products && products.length > 0) {
            const ops = products.map((p: any) => ({
                replaceOne: {
                    filter: { userId, localId: p.localId },
                    replacement: { ...p, userId, syncedAt: new Date() },
                    upsert: true
                }
            }));
            const res = await RemoteProduct.bulkWrite(ops);
            results.products = res.upsertedCount + res.modifiedCount;
        }

        // Tables
        if (tables && tables.length > 0) {
            const ops = tables.map((t: any) => ({
                replaceOne: {
                    filter: { userId, localId: t.localId },
                    replacement: { ...t, userId, syncedAt: new Date() },
                    upsert: true
                }
            }));
            const res = await RemoteTable.bulkWrite(ops);
            results.tables = res.upsertedCount + res.modifiedCount;
        }

        // Sessions (Cajas)
        if (sessions && sessions.length > 0) {
            const ops = sessions.map((s: any) => ({
                replaceOne: {
                    filter: { userId, localId: s.localId },
                    replacement: { ...s, userId, syncedAt: new Date() },
                    upsert: true
                }
            }));
            const res = await RemoteSession.bulkWrite(ops);
            results.sessions = res.upsertedCount + res.modifiedCount;
        }

        // Orders
        if (orders && orders.length > 0) {
            const ops = orders.map((o: any) => ({
                replaceOne: {
                    filter: { userId, localId: o.localId },
                    replacement: { ...o, userId, syncedAt: new Date() },
                    upsert: true
                }
            }));
            const res = await RemoteOrder.bulkWrite(ops);
            results.orders = res.upsertedCount + res.modifiedCount;
        }

        return NextResponse.json({
            success: true,
            results,
            timestamp: new Date()
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json(
            { message: error.message || 'Error interno en sincronización' },
            { status: 500 }
        );
    }
}
