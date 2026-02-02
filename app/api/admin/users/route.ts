import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        await dbConnect();

        let query: any = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            query = {
                $or: [
                    { name: regex },
                    { email: regex },
                    { restaurantName: regex },
                ]
            };
        }

        // Only return necessary fields
        const users = await User.find(query)
            .select('name email restaurantName role plan devices isActive createdAt')
            .sort({ createdAt: -1 });

        return NextResponse.json({ users });

    } catch (error: any) {
        console.error('Admin Users Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
