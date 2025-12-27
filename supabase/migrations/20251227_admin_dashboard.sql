-- 1. DAILY METRICS FUNCTION
create or replace function get_daily_metrics(
        p_tenant_id uuid,
        p_date date default current_date
    ) returns jsonb language plpgsql stable security definer as $$
declare scheduled_count integer;
confirmed_count integer;
completed_count integer;
noshow_count integer;
begin
select count(*) filter (
        where status = 'scheduled'
    ),
    count(*) filter (
        where status = 'confirmed'
    ),
    count(*) filter (
        where status = 'completed'
    ),
    count(*) filter (
        where status = 'no_show'
    ) into scheduled_count,
    confirmed_count,
    completed_count,
    noshow_count
from appointments
where tenant_id = p_tenant_id
    and date(start_time) = p_date;
return jsonb_build_object(
    'scheduled',
    scheduled_count,
    'confirmed',
    confirmed_count,
    'completed',
    completed_count,
    'noShows',
    noshow_count
);
end;
$$;
-- 2. REVENUE METRICS FUNCTION
create or replace function get_revenue_metrics(p_tenant_id uuid) returns jsonb language plpgsql stable security definer as $$
declare today_rev decimal(10, 2);
week_rev decimal(10, 2);
month_rev decimal(10, 2);
last_month_rev decimal(10, 2);
growth_pct decimal(5, 2);
begin -- Today
select coalesce(sum(coalesce(final_price, price)), 0) -- Use final_price if exists, else service price
    into today_rev
from appointments a
    join services s on a.service_id = s.id
where a.tenant_id = p_tenant_id
    and a.status = 'completed'
    and date(a.end_time) = current_date;
-- This Week
select coalesce(sum(coalesce(final_price, price)), 0) into week_rev
from appointments a
    join services s on a.service_id = s.id
where a.tenant_id = p_tenant_id
    and a.status = 'completed'
    and a.end_time >= date_trunc('week', now());
-- This Month
select coalesce(sum(coalesce(final_price, price)), 0) into month_rev
from appointments a
    join services s on a.service_id = s.id
where a.tenant_id = p_tenant_id
    and a.status = 'completed'
    and a.end_time >= date_trunc('month', now());
-- Last Month (For Growth)
select coalesce(sum(coalesce(final_price, price)), 0) into last_month_rev
from appointments a
    join services s on a.service_id = s.id
where a.tenant_id = p_tenant_id
    and a.status = 'completed'
    and a.end_time >= date_trunc('month', now() - interval '1 month')
    and a.end_time < date_trunc('month', now());
-- Growth Calculation
if last_month_rev > 0 then growth_pct := ((month_rev - last_month_rev) / last_month_rev) * 100;
else growth_pct := 100;
-- If 0 to X, 100% growth (or handle as null)
end if;
return jsonb_build_object(
    'today',
    today_rev,
    'week',
    week_rev,
    'month',
    month_rev,
    'growth',
    growth_pct
);
end;
$$;