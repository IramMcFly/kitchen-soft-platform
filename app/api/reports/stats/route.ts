import { NextRequest, NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { createSupabaseAdminClient } from '@/lib/supabase';

const SYNC_TABLES = {
    users: 'sync_users',
    products: 'sync_products',
    tables: 'sync_tables',
    sessions: 'sync_sessions',
    orders: 'sync_orders',
    categories: 'sync_categories',
    inventoryMovements: 'sync_inventory_movements',
} as const;

type SyncTableName = (typeof SYNC_TABLES)[keyof typeof SYNC_TABLES];

export async function GET(req: NextRequest) {
    try {
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const admin = createSupabaseAdminClient();
        if (!admin) {
            return NextResponse.json({ message: 'Supabase is not configured' }, { status: 503 });
        }

        const countByTable = async (tableName: string) => {
            const { count, error } = await admin
                .from(tableName)
                .select('id', { count: 'exact', head: true })
                .eq('user_id', identity.userId);

            if (error) {
                throw new Error(`Error counting ${tableName}: ${error.message}`);
            }

            return count || 0;
        };

        const lastUpdatedAtByTable = async (tableName: SyncTableName) => {
            const { data, error } = await admin
                .from(tableName)
                .select('updated_at')
                .eq('user_id', identity.userId)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (error) {
                throw new Error(`Error reading ${tableName} updated_at: ${error.message}`);
            }

            const value = data?.[0]?.updated_at;
            return typeof value === 'string' ? value : null;
        };

        const [productsCount, tablesCount, sessionsCount, ordersCount, ordersRows] = await Promise.all([
            countByTable('sync_products'),
            countByTable('sync_tables'),
            countByTable('sync_sessions'),
            countByTable('sync_orders'),
            admin
                .from('sync_orders')
                .select('payload')
                .eq('user_id', identity.userId),
        ]);

        if (ordersRows.error) {
            throw new Error(`Error reading sync_orders: ${ordersRows.error.message}`);
        }

        const totalSales = (ordersRows.data || []).reduce((sum: number, row: any) => {
            const payload = row?.payload || {};
            const total = Number(payload.total ?? payload?.totales?.total ?? 0);
            return sum + (Number.isFinite(total) ? total : 0);
        }, 0);

        const response: Record<string, any> = {
            stats: {
                products: productsCount,
                tables: tablesCount,
                sessions: sessionsCount,
                orders: ordersCount,
                totalSales
            }
        };

        if (String(identity.plan || '').toUpperCase() === 'PRO') {
            const [
                usersCount,
                categoriesCount,
                inventoryMovementsCount,
                devicesCount,
                lastProductsSync,
                lastTablesSync,
                lastSessionsSync,
                lastOrdersSync,
                lastCategoriesSync,
                lastInventorySync,
                lastUsersSync,
            ] = await Promise.all([
                countByTable(SYNC_TABLES.users),
                countByTable(SYNC_TABLES.categories),
                countByTable(SYNC_TABLES.inventoryMovements),
                admin
                    .from('user_devices')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', identity.userId)
                    .then(({ count, error }) => {
                        if (error) {
                            throw new Error(`Error counting user_devices: ${error.message}`);
                        }
                        return count || 0;
                    }),
                lastUpdatedAtByTable(SYNC_TABLES.products),
                lastUpdatedAtByTable(SYNC_TABLES.tables),
                lastUpdatedAtByTable(SYNC_TABLES.sessions),
                lastUpdatedAtByTable(SYNC_TABLES.orders),
                lastUpdatedAtByTable(SYNC_TABLES.categories),
                lastUpdatedAtByTable(SYNC_TABLES.inventoryMovements),
                lastUpdatedAtByTable(SYNC_TABLES.users),
            ]);

            const rowsByTable: Record<string, number> = {
                users: usersCount,
                products: productsCount,
                tables: tablesCount,
                sessions: sessionsCount,
                orders: ordersCount,
                categories: categoriesCount,
                inventoryMovements: inventoryMovementsCount,
            };

            const syncCandidates = [
                lastProductsSync,
                lastTablesSync,
                lastSessionsSync,
                lastOrdersSync,
                lastCategoriesSync,
                lastInventorySync,
                lastUsersSync,
            ].filter((value): value is string => Boolean(value));

            const lastSyncAt = syncCandidates.reduce<string | null>((latest, current) => {
                if (!latest) {
                    return current;
                }

                return new Date(current).getTime() > new Date(latest).getTime() ? current : latest;
            }, null);

            response.system = {
                currentPlan: identity.plan,
                cloudSyncEnabled: identity.cloudSyncEnabled,
                devicesCount,
                totalSyncedRows: Object.values(rowsByTable).reduce((sum, value) => sum + Number(value || 0), 0),
                lastSyncAt,
                rowsByTable,
            };
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Stats Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
