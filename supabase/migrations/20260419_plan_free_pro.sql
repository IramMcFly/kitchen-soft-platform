begin;

-- Normalize all stored plan values to the FREE/PRO model.
update public.user_profiles
set plan = case
	when upper(plan) in ('FREE', 'PRO') then upper(plan)
	when cloud_sync_enabled = true then 'PRO'
	else 'FREE'
end;

alter table public.user_profiles
drop constraint if exists user_profiles_plan_check;

alter table public.user_profiles
add constraint user_profiles_plan_check
check (plan in ('FREE', 'PRO'));

-- Keep cloud capability aligned with plan model.
update public.user_profiles
set cloud_sync_enabled = case when plan = 'PRO' then true else false end
where cloud_sync_enabled is distinct from case when plan = 'PRO' then true else false end;

commit;
