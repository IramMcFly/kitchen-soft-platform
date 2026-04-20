import { NextRequest, NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { getPlanCapabilities } from '@/lib/cloud-plan';

export async function GET(req: NextRequest) {
  try {
    const token = getCloudTokenFromRequest(req);

    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const identity = await authenticateCloudToken(token);

    if (!identity) {
      return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 });
    }

    const capabilities = getPlanCapabilities(identity.plan);

    return NextResponse.json({
      user: {
        id: identity.userId,
        name: identity.name,
        email: identity.email,
        role: identity.role,
        plan: identity.plan,
        restaurantName: identity.restaurantName,
        cloudSyncEnabled: identity.cloudSyncEnabled ?? capabilities.cloudSyncEnabled,
      },
    });
  } catch (error) {
    console.error('Auth Me Error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
