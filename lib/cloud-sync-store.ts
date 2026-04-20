import 'server-only';
import { createSupabaseUserClient } from './supabase';

type SyncTableKey =
  | 'users'
  | 'products'
  | 'tables'
  | 'sessions'
  | 'orders'
  | 'categories'
  | 'inventoryMovements';

type SyncPayload = Partial<Record<SyncTableKey, any[]>>;

const TABLE_BY_KEY: Record<SyncTableKey, string> = {
  users: 'sync_users',
  products: 'sync_products',
  tables: 'sync_tables',
  sessions: 'sync_sessions',
  orders: 'sync_orders',
  categories: 'sync_categories',
  inventoryMovements: 'sync_inventory_movements',
};

function normalizeSyncRow(item: any) {
  const localId = String(item?.id || item?.localId || item?._id || crypto.randomUUID());

  const payload = {
    ...item,
    id: item?.id || localId,
    localId,
  };

  delete payload._id;

  return {
    local_id: localId,
    payload,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function upsertCloudSyncPayload(userId: string, payload: SyncPayload, accessToken: string) {
  const userClient = createSupabaseUserClient(accessToken);

  if (!userClient) {
    throw new Error('Supabase user client is not configured');
  }

  const result: Record<string, number> = {};

  for (const [key, tableName] of Object.entries(TABLE_BY_KEY) as Array<[SyncTableKey, string]>) {
    const rows = Array.isArray(payload[key]) ? payload[key] || [] : [];

    if (!rows.length) {
      result[key] = 0;
      continue;
    }

    const normalizedRows = rows.map((item) => {
      const normalized = normalizeSyncRow(item);
      return {
        user_id: userId,
        ...normalized,
      };
    });

      const { error } = await userClient
      .from(tableName)
      .upsert(normalizedRows, { onConflict: 'user_id,local_id' });

    if (error) {
      throw new Error(`Error syncing ${key}: ${error.message}`);
    }

    result[key] = rows.length;
  }

  return result;
}

export async function pullCloudSyncPayload(userId: string, accessToken: string) {
  const userClient = createSupabaseUserClient(accessToken);

  if (!userClient) {
    throw new Error('Supabase user client is not configured');
  }

  const pulled: SyncPayload = {};

  for (const [key, tableName] of Object.entries(TABLE_BY_KEY) as Array<[SyncTableKey, string]>) {
    const { data, error } = await userClient
      .from(tableName)
      .select('payload')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true });

    if (error) {
      throw new Error(`Error pulling ${key}: ${error.message}`);
    }

    pulled[key] = (data || []).map((row: any) => row.payload);
  }

  return pulled;
}
