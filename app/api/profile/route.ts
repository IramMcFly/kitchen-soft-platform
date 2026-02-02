import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { profileUpdateSchema } from '@/lib/validations';

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const validation = profileUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, restaurantName } = validation.data;

        await dbConnect();

        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email },
            { name, restaurantName },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json(
            {
                message: 'Perfil actualizado exitosamente',
                user: {
                    name: updatedUser.name,
                    restaurantName: updatedUser.restaurantName
                }
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
