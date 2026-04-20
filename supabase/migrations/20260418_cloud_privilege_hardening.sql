revoke all on table
  public.user_profiles,
  public.user_devices,
  public.sync_users,
  public.sync_products,
  public.sync_tables,
  public.sync_sessions,
  public.sync_orders,
  public.sync_categories,
  public.sync_inventory_movements
from anon;

revoke all on table
  public.user_profiles,
  public.user_devices,
  public.sync_users,
  public.sync_products,
  public.sync_tables,
  public.sync_sessions,
  public.sync_orders,
  public.sync_categories,
  public.sync_inventory_movements
from authenticated;

grant select, insert, update, delete on table
  public.user_profiles,
  public.user_devices,
  public.sync_users,
  public.sync_products,
  public.sync_tables,
  public.sync_sessions,
  public.sync_orders,
  public.sync_categories,
  public.sync_inventory_movements
to authenticated;

revoke all on sequence
  public.sync_users_id_seq,
  public.sync_products_id_seq,
  public.sync_tables_id_seq,
  public.sync_sessions_id_seq,
  public.sync_orders_id_seq,
  public.sync_categories_id_seq,
  public.sync_inventory_movements_id_seq
from anon;

revoke all on sequence
  public.sync_users_id_seq,
  public.sync_products_id_seq,
  public.sync_tables_id_seq,
  public.sync_sessions_id_seq,
  public.sync_orders_id_seq,
  public.sync_categories_id_seq,
  public.sync_inventory_movements_id_seq
from authenticated;

grant usage, select on sequence
  public.sync_users_id_seq,
  public.sync_products_id_seq,
  public.sync_tables_id_seq,
  public.sync_sessions_id_seq,
  public.sync_orders_id_seq,
  public.sync_categories_id_seq,
  public.sync_inventory_movements_id_seq
to authenticated;
