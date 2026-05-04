import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from './supabase';
import { normalizeCloudPlan, getPlanCapabilities, type CloudPlan } from './cloud-plan';

export type CloudRole = 'OWNER' | 'ADMIN';

export type CloudProfile = {
  id: string;
  name: string;
  email: string;
  restaurant_name: string;
  plan: CloudPlan;
  role: CloudRole;
  is_active: boolean;
  cloud_sync_enabled: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
};

export type CloudDevice = {
  id: string;
  deviceId: string;
  name: string;
  lastLogin: string;
  createdAt: string;
};

type UnknownRecord = Record<string, unknown>;

function getStringValue(record: UnknownRecord | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getNullableStringValue(record: UnknownRecord | undefined, key: string): string | null {
  const value = record?.[key];
  if (value === null) {
    return null;
  }

  return typeof value === 'string' && value.trim() ? value : null;
}

function getBooleanValue(record: UnknownRecord | undefined, key: string): boolean | undefined {
  const value = record?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

function createDefaultName(email?: string | null, metadata?: UnknownRecord) {
  const metadataName = getStringValue(metadata, 'name');
  if (metadataName) return metadataName;

  const metadataFullName = getStringValue(metadata, 'full_name');
  if (metadataFullName) return metadataFullName;

  if (!email) return 'Propietario';
  return String(email).split('@')[0] || 'Propietario';
}

function createDefaultRestaurantName(metadata?: UnknownRecord) {
  const byCamelCase = getStringValue(metadata, 'restaurantName');
  if (byCamelCase) return byCamelCase;

  const bySnakeCase = getStringValue(metadata, 'restaurant_name');
  if (bySnakeCase) return bySnakeCase;

  return 'Mi Restaurante';
}

function normalizeProfile(row: unknown): CloudProfile {
  const record = (row && typeof row === 'object' ? row : {}) as UnknownRecord;
  const plan = normalizeCloudPlan(getStringValue(record, 'plan'));
  const capabilities = getPlanCapabilities(plan);
  const role = getStringValue(record, 'role');
  const isActive = getBooleanValue(record, 'is_active');
  const cloudSyncEnabled = getBooleanValue(record, 'cloud_sync_enabled');

  return {
    id: getStringValue(record, 'id') || '',
    name: getStringValue(record, 'name') || 'Propietario',
    email: getStringValue(record, 'email') || '',
    restaurant_name: getStringValue(record, 'restaurant_name') || 'Mi Restaurante',
    plan,
    role: role === 'ADMIN' ? 'ADMIN' : 'OWNER',
    is_active: isActive !== false,
    cloud_sync_enabled: cloudSyncEnabled ?? capabilities.cloudSyncEnabled,
    stripe_customer_id: getNullableStringValue(record, 'stripe_customer_id'),
    stripe_subscription_id: getNullableStringValue(record, 'stripe_subscription_id'),
    stripe_subscription_status: getNullableStringValue(record, 'stripe_subscription_status'),
  };
}

function normalizeDevice(row: unknown): CloudDevice {
  const record = (row && typeof row === 'object' ? row : {}) as UnknownRecord;

  return {
    id: getStringValue(record, 'id') || '',
    deviceId: getStringValue(record, 'device_id') || '',
    name: getStringValue(record, 'name') || 'Dispositivo',
    lastLogin: getStringValue(record, 'last_login_at') || getStringValue(record, 'updated_at') || new Date().toISOString(),
    createdAt: getStringValue(record, 'created_at') || new Date().toISOString(),
  };
}

export async function getCloudProfileById(userId: string): Promise<CloudProfile | null> {
  const admin = createSupabaseAdminClient();

  if (!admin || !userId) {
    return null;
  }

  const { data, error } = await admin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error loading cloud profile: ${error.message}`);
  }

  return data ? normalizeProfile(data) : null;
}

export async function upsertCloudProfile(input: {
  id: string;
  email?: string | null;
  name?: string | null;
  restaurantName?: string | null;
  plan?: string | null;
  role?: string | null;
  isActive?: boolean;
  cloudSyncEnabled?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: string | null;
}): Promise<CloudProfile> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    throw new Error('Supabase admin client is not configured');
  }

  const plan = normalizeCloudPlan(input.plan);
  const capabilities = getPlanCapabilities(plan);

  const payload = {
    id: input.id,
    email: input.email || '',
    name: input.name || 'Propietario',
    restaurant_name: input.restaurantName || 'Mi Restaurante',
    plan,
    role: input.role === 'ADMIN' ? 'ADMIN' : 'OWNER',
    is_active: input.isActive !== false,
    cloud_sync_enabled: input.cloudSyncEnabled ?? capabilities.cloudSyncEnabled,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    stripe_subscription_status: input.stripeSubscriptionStatus ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from('user_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error upserting cloud profile: ${error?.message || 'Unknown error'}`);
  }

  return normalizeProfile(data);
}

export async function ensureCloudProfileFromAuthUser(authUser: User): Promise<CloudProfile> {
  const existing = await getCloudProfileById(authUser.id);

  if (existing) {
    if (authUser.email && existing.email !== authUser.email) {
      return upsertCloudProfile({
        id: existing.id,
        email: authUser.email,
        name: existing.name,
        restaurantName: existing.restaurant_name,
        plan: existing.plan,
        role: existing.role,
        isActive: existing.is_active,
        cloudSyncEnabled: existing.cloud_sync_enabled,
        stripeCustomerId: existing.stripe_customer_id,
        stripeSubscriptionId: existing.stripe_subscription_id,
        stripeSubscriptionStatus: existing.stripe_subscription_status,
      });
    }

    return existing;
  }

  const metadata = (authUser.user_metadata || {}) as UnknownRecord;
  const metadataPlan = getStringValue(metadata, 'plan') || 'FREE';
  const metadataRole = getStringValue(metadata, 'role') || 'OWNER';

  return upsertCloudProfile({
    id: authUser.id,
    email: authUser.email,
    name: createDefaultName(authUser.email, metadata),
    restaurantName: createDefaultRestaurantName(metadata),
    plan: metadataPlan,
    role: metadataRole,
    isActive: true,
  });
}

export async function updateCloudProfileById(userId: string, updates: {
  name?: string;
  restaurantName?: string;
  plan?: string;
  role?: string;
  isActive?: boolean;
  cloudSyncEnabled?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: string | null;
}) {
  const current = await getCloudProfileById(userId);

  if (!current) {
    throw new Error('Cloud profile not found');
  }

  return upsertCloudProfile({
    id: current.id,
    email: current.email,
    name: updates.name ?? current.name,
    restaurantName: updates.restaurantName ?? current.restaurant_name,
    plan: updates.plan ?? current.plan,
    role: updates.role ?? current.role,
    isActive: updates.isActive ?? current.is_active,
    cloudSyncEnabled: updates.cloudSyncEnabled ?? current.cloud_sync_enabled,
    stripeCustomerId: updates.stripeCustomerId ?? current.stripe_customer_id,
    stripeSubscriptionId: updates.stripeSubscriptionId ?? current.stripe_subscription_id,
    stripeSubscriptionStatus: updates.stripeSubscriptionStatus ?? current.stripe_subscription_status,
  });
}

export async function getCloudProfileByStripeCustomerId(customerId: string): Promise<CloudProfile | null> {
  const admin = createSupabaseAdminClient();

  if (!admin || !customerId) {
    return null;
  }

  const { data, error } = await admin
    .from('user_profiles')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error loading profile by customer: ${error.message}`);
  }

  return data ? normalizeProfile(data) : null;
}

export async function listCloudDevices(userId: string): Promise<CloudDevice[]> {
  const admin = createSupabaseAdminClient();

  if (!admin || !userId) {
    return [];
  }

  const { data, error } = await admin
    .from('user_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_login_at', { ascending: false });

  if (error) {
    throw new Error(`Error loading devices: ${error.message}`);
  }

  return (data || []).map((row) => normalizeDevice(row));
}

export async function isCloudDeviceLinked(userId: string, deviceId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  if (!admin || !userId || !deviceId) {
    return false;
  }

  const normalizedDeviceId = deviceId.trim();

  if (!normalizedDeviceId) {
    return false;
  }

  const { data, error } = await admin
    .from('user_devices')
    .select('id')
    .eq('user_id', userId)
    .eq('device_id', normalizedDeviceId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Error validating cloud device: ${error.message}`);
  }

  return Boolean(data?.id);
}

export async function upsertCloudDevice(input: {
  userId: string;
  deviceId: string;
  name?: string | null;
}): Promise<CloudDevice> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    throw new Error('Supabase admin client is not configured');
  }

  const deviceName = (input.name || '').trim() || 'Dispositivo';
  const normalizedDeviceId = input.deviceId.trim();

  if (!normalizedDeviceId) {
    throw new Error('Device ID is required');
  }

  const { error: clearError } = await admin
    .from('user_devices')
    .delete()
    .eq('user_id', input.userId)
    .neq('device_id', normalizedDeviceId);

  if (clearError) {
    throw new Error(`Error clearing previous devices: ${clearError.message}`);
  }

  const payload = {
    user_id: input.userId,
    device_id: normalizedDeviceId,
    name: deviceName,
    last_login_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from('user_devices')
    .upsert(payload, { onConflict: 'user_id,device_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error upserting device: ${error?.message || 'Unknown error'}`);
  }

  return normalizeDevice(data);
}

export async function deleteCloudDevice(userId: string, deviceId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  if (!admin || !userId || !deviceId) {
    return false;
  }

  const { data, error } = await admin
    .from('user_devices')
    .delete()
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .select('id');

  if (error) {
    throw new Error(`Error deleting device: ${error.message}`);
  }

  return Array.isArray(data) && data.length > 0;
}
