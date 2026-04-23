import { NextRequest, NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { getPlanCapabilities } from '@/lib/cloud-plan';

const COOKIE_NAME = 'ksp_token';

function unauthorizedResponse(message: string) {
  const response = NextResponse.json({ message }, { status: 401 });

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function GET(req: NextRequest) {
  try {
    const token = getCloudTokenFromRequest(req);

    if (!token) {
      return unauthorizedResponse('No autorizado');
    }

    const identity = await authenticateCloudToken(token);

    if (!identity) {
      return unauthorizedResponse('Token inválido o expirado');
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
