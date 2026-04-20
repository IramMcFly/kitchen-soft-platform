import 'server-only';
import { getPlanCapabilities } from './cloud-plan';
import { ensureCloudProfileFromAuthUser } from './cloud-profile';
import { verifySupabaseAccessToken } from './supabase';

export type CloudIdentity = {
  provider: 'supabase';
  userId: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  restaurantName: string;
  cloudSyncEnabled: boolean;
  expiresAt?: number;
}

export function getBearerTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length).trim() || null;
}

function getCookieTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie');

  if (!cookieHeader) {
    return null;
  }

  const tokenCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('ksp_token='));

  if (!tokenCookie) {
    return null;
  }

  const token = tokenCookie.slice('ksp_token='.length).trim();
  if (!token) {
    return null;
  }

  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

export function getCloudTokenFromRequest(req: Request): string | null {
  return getBearerTokenFromRequest(req) || getCookieTokenFromRequest(req);
}

async function fromSupabaseToken(token: string): Promise<CloudIdentity | null> {
  const authUser = await verifySupabaseAccessToken(token);

  if (!authUser) {
    return null;
  }

  const profile = await ensureCloudProfileFromAuthUser(authUser);

  if (!profile.is_active) {
    return null;
  }

  const capabilities = getPlanCapabilities(profile.plan);

  return {
    provider: 'supabase',
    userId: profile.id,
    name: profile.name || authUser.user_metadata?.name || authUser.email || 'Propietario',
    email: profile.email || authUser.email || '',
    plan: profile.plan,
    role: profile.role,
    restaurantName: profile.restaurant_name,
    cloudSyncEnabled: profile.cloud_sync_enabled ?? capabilities.cloudSyncEnabled,
  };
}

export async function authenticateCloudToken(token: string): Promise<CloudIdentity | null> {
  if (!token) {
    return null;
  }

  return fromSupabaseToken(token);
}
