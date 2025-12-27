-- 1. ENHANCE APPOINTMENTS (Cancellation Fields)
alter table appointments
add column if not exists cancel_reason text,
    add column if not exists cancelled_at timestamp with time zone;
-- 2. CLIENT STATS RPC (Efficient History)
create or replace function get_client_stats(p_client_id uuid) returns jsonb language plpgsql stable security definer as $$
declare total_spent decimal(10, 2);
total_visits integer;
avg_rating decimal(3, 2);
last_visit timestamp with time zone;
begin -- Total Spent & Visits (Completed only)
select coalesce(sum(s.price), 0),
    count(*) into total_spent,
    total_visits
from appointments a
    join services s on a.service_id = s.id
where a.client_id = p_client_id
    and a.status = 'completed';
-- Last Visit
select max(end_time) into last_visit
from appointments
where client_id = p_client_id
    and status = 'completed';
-- Avg Rating (from Reviews)
select avg(service_rating) into avg_rating
from reviews
where client_id = p_client_id;
return json_build_object(
    'totalSpent',
    total_spent,
    'totalVisits',
    total_visits,
    'averageRating',
    coalesce(avg_rating, 0),
    'lastVisit',
    last_visit
);
end;
$$;
-- 3. HELPER: Check Policy
-- Instead of code validation, we can put policy in 'saloes' settings
-- and use it in Edge Function. No SQL needed here, handled in JSONB.