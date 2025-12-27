-- 1. PLANS TABLE
create table if not exists plans (
    id uuid primary key default gen_random_uuid(),
    name varchar not null unique,
    -- 'starter', 'professional', 'enterprise'
    price_monthly decimal(10, 2) not null,
    price_yearly decimal(10, 2) not null,
    -- Limits (null means unlimited)
    max_appointments integer,
    max_professionals integer,
    features jsonb default '[]'::jsonb,
    -- ['email_notifications', 'sms', 'google_calendar', 'ai_agents']
    created_at timestamp with time zone default now()
);
-- 2. UPDATE TENANTS (SALOES)
alter table saloes
add column if not exists plan_id uuid references plans(id),
    add column if not exists subscription_status varchar default 'active',
    -- active, past_due, canceled
add column if not exists subscription_renews_at timestamp with time zone;
-- 3. SEED PLANS
insert into plans (
        name,
        price_monthly,
        price_yearly,
        max_appointments,
        max_professionals,
        features
    )
values (
        'Starter',
        99.00,
        990.00,
        100,
        1,
        '["email_notifications", "basic_reports"]'
    ),
    (
        'Professional',
        299.00,
        2990.00,
        500,
        10,
        '["email_notifications", "sms", "advanced_reports", "google_calendar", "ai_agents", "chat_support"]'
    ),
    (
        'Enterprise',
        999.00,
        9990.00,
        null,
        null,
        '["all_notifications", "custom_reports", "all_integrations", "all_ai", "priority_support", "api_access"]'
    );
-- Assign default plan to existing tenants (Professional as safe default)
update saloes
set plan_id = (
        select id
        from plans
        where name = 'Professional'
    )
where plan_id is null;
-- 4. FORCE LIMIT: APPOINTMENTS
create or replace function check_appointment_limit() returns trigger language plpgsql as $$
declare v_plan_limit integer;
v_current_count integer;
v_plan_id uuid;
begin -- Get Tenant Plan
select plan_id into v_plan_id
from saloes
where id = new.tenant_id;
-- Get Limit
select max_appointments into v_plan_limit
from plans
where id = v_plan_id;
-- If unlimited, pass
if v_plan_limit is null then return new;
end if;
-- Count existing for this month
select count(*) into v_current_count
from appointments
where tenant_id = new.tenant_id
    and date_trunc('month', start_time) = date_trunc('month', new.start_time);
if v_current_count >= v_plan_limit then raise exception 'Limite mensal de agendamentos atingido para seu plano atual.';
end if;
return new;
end;
$$;
create trigger enforce_appointment_limit before
insert on appointments for each row execute procedure check_appointment_limit();
-- 5. FORCE LIMIT: PROFESSIONALS
create or replace function check_professional_limit() returns trigger language plpgsql as $$
declare v_plan_limit integer;
v_current_count integer;
v_plan_id uuid;
v_tenant_id uuid;
begin -- Only check for staff role
if new.role != 'staff' then return new;
end if;
v_tenant_id := new.tenant_id;
-- Get Tenant Plan
select plan_id into v_plan_id
from saloes
where id = v_tenant_id;
-- Get Limit
select max_professionals into v_plan_limit
from plans
where id = v_plan_id;
-- If unlimited, pass
if v_plan_limit is null then return new;
end if;
-- Count existing active staff
select count(*) into v_current_count
from profiles
where tenant_id = v_tenant_id
    and role = 'staff'
    and (
        status = 'active'
        or status is null
    );
-- Assuming we added status in previous step, handling null as active for backward compatibility
if v_current_count >= v_plan_limit then raise exception 'Limite de profissionais atingido para seu plano atual.';
end if;
return new;
end;
$$;
create trigger enforce_professional_limit before
insert on profiles for each row execute procedure check_professional_limit();