import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Params are now a Promise in Next.js 15+
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const { isActive } = await req.json();

        if (typeof isActive !== 'boolean') {
            return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select('email isActive');

        if (!user) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} correctamente`,
            user: { id: user._id, isActive: user.isActive }
        });

    } catch (error: any) {
        console.error('Admin Update Status Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
