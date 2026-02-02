import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { registerSchema } from '@/lib/validations';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, password, restaurantName } = validation.data;

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return NextResponse.json(
                { message: 'El correo electrónico ya está registrado' },
                { status: 400 }
            );
        }

        // Create new user (password hashing is handled in the model pre-save hook)
        const user = await User.create({
            name,
            email,
            password,
            restaurantName,
        });

        return NextResponse.json(
            { message: 'Usuario registrado exitosamente', user: { id: user._id, name: user.name, email: user.email } },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
