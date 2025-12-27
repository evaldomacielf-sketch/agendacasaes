-- 1. ENHANCE PROFILES (Professionals)
alter table profiles
add column if not exists phone varchar,
    add column if not exists specialties text [] default '{}',
    add column if not exists working_hours jsonb default '[{"day": 1, "start": "09:00", "end": "18:00"}, {"day": 2, "start": "09:00", "end": "18:00"}, {"day": 3, "start": "09:00", "end": "18:00"}, {"day": 4, "start": "09:00", "end": "18:00"}, {"day": 5, "start": "09:00", "end": "18:00"}]'::jsonb,
    add column if not exists commission jsonb default '{"type": "percentage", "value": 30}'::jsonb,
    add column if not exists status varchar default 'active' check (status in ('active', 'inactive'));
-- 2. ENHANCE SERVICES
alter table services
add column if not exists category varchar default 'Geral',
    add column if not exists status varchar default 'active' check (status in ('active', 'inactive'));
-- 3. ADMIN VIEW: PROFESSIONALS
create or replace view admin_professionals_view as
select p.id,
    p.tenant_id,
    p.full_name as name,
    p.email,
    p.phone,
    p.avatar_url as photo,
    p.specialties,
    p.working_hours,
    p.commission,
    p.status,
    p.rating,
    p.google_calendar_id,
    -- Aggregates
    (
        select count(*)
        from appointments a
        where a.staff_id = p.id
    ) as total_appointments,
    (
        select coalesce(sum(coalesce(final_price, s.price)), 0)
        from appointments a
            left join services s on a.service_id = s.id
        where a.staff_id = p.id
            and a.status = 'completed'
    ) as total_revenue
from profiles p
where p.role in ('staff', 'owner', 'manager');
-- 4. ADMIN VIEW: SERVICES
create or replace view admin_services_view as
select s.id,
    s.tenant_id,
    s.name,
    s.description,
    s.duration_minutes as duration,
    s.price,
    s.category,
    s.status,
    s.rating,
    -- Aggregates
    (
        select count(*)
        from appointments a
        where a.service_id = s.id
    ) as total_appointments
from services s;