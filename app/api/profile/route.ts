import { NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { profileUpdateSchema } from '@/lib/validations';
import {
    getCloudProfileById,
    updateCloudProfileById,
} from '@/lib/cloud-profile';
import { getPlanCapabilities } from '@/lib/cloud-plan';

export async function GET(req: Request) {
    try {
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const profile = await getCloudProfileById(identity.userId);
        if (!profile) {
            return NextResponse.json({ message: 'Perfil no encontrado' }, { status: 404 });
        }

        const capabilities = getPlanCapabilities(profile.plan);

        return NextResponse.json(
            {
                user: {
                    id: profile.id,
                    name: profile.name,
                    restaurantName: profile.restaurant_name,
                    email: profile.email,
                    plan: profile.plan,
                    role: profile.role,
                    cloudSyncEnabled: profile.cloud_sync_enabled ?? capabilities.cloudSyncEnabled,
                }
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
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
        const updatedProfile = await updateCloudProfileById(identity.userId, {
            name,
            restaurantName,
        });

        const capabilities = getPlanCapabilities(updatedProfile.plan);

        return NextResponse.json(
            {
                message: 'Perfil actualizado exitosamente',
                user: {
                    id: updatedProfile.id,
                    name: updatedProfile.name,
                    restaurantName: updatedProfile.restaurant_name,
                    email: updatedProfile.email,
                    plan: updatedProfile.plan,
                    role: updatedProfile.role,
                    cloudSyncEnabled: updatedProfile.cloud_sync_enabled ?? capabilities.cloudSyncEnabled,
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
