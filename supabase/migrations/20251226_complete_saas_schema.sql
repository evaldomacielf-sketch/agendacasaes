/*
 * COMPLETION DATE: 2025-12-26
 * DESCRIPTION: Complete SaaS Schema for AgendaCasaES
 * INCLUDES: Tenants, Users, Clients, Services, Appointments, Inventory, Finance, Marketing, Reviews, Notifications.
 * FEATURES: Multi-tenancy (RLS), PgVector, Realtime, Auto-updated timestamps.
 */
-- EXTENSIONS
create extension if not exists vector;
-- 1. TENANTS (SALÕES) - Existing or Create
create table if not exists saloes (
    id uuid primary key default gen_random_uuid(),
    nome varchar not null,
    slug varchar unique not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    plan_type varchar default 'trial',
    -- trial, pro, enterprise
    settings jsonb default '{}'::jsonb
);
-- 2. USERS (PROFILES) - Links to Auth.Users
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email varchar not null,
    full_name varchar,
    role varchar default 'staff',
    -- owner, manager, staff
    tenant_id uuid references saloes(id) on delete
    set null,
        avatar_url text,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
);
-- 3. CLIENTS
create table if not exists clients (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    full_name varchar not null,
    email varchar,
    phone varchar,
    birth_date date,
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- 4. SERVICES (With Embedding)
create table if not exists services (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    name varchar not null,
    description text,
    price decimal(10, 2) not null,
    duration_minutes integer not null,
    embedding vector(384),
    -- For semantic search
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- 5. APPOINTMENTS
create table if not exists appointments (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    client_id uuid references clients(id) on delete
    set null,
        service_id uuid references services(id) on delete
    set null,
        staff_id uuid references profiles(id) on delete
    set null,
        start_time timestamp with time zone not null,
        end_time timestamp with time zone not null,
        status varchar default 'scheduled',
        -- scheduled, completed, cancelled, no_show
        notes text,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
);
-- 6. INVENTORY
create table if not exists inventory (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    product_name varchar not null,
    sku varchar,
    quantity integer default 0,
    min_quantity integer default 5,
    cost_price decimal(10, 2),
    sale_price decimal(10, 2),
    unit varchar default 'un',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- 7. FINANCIAL TRANSACTIONS
create table if not exists financial_transactions (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    type varchar not null,
    -- income, expense
    category varchar,
    -- service, product, salary, rent, utilities
    amount decimal(10, 2) not null,
    description text,
    transaction_date date default current_date,
    related_appointment_id uuid references appointments(id) on delete
    set null,
        created_at timestamp with time zone default now()
);
-- 8. MARKETING CAMPAIGNS
create table if not exists marketing_campaigns (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    title varchar not null,
    content text,
    target_audience varchar,
    -- all, churned, loyal
    status varchar default 'draft',
    -- draft, scheduled, sent
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    metrics jsonb default '{}'::jsonb,
    -- opens, clicks
    created_at timestamp with time zone default now()
);
-- 9. REVIEWS (With Embedding)
create table if not exists reviews (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    appointment_id uuid references appointments(id) on delete
    set null,
        client_id uuid references clients(id) on delete
    set null,
        rating integer check (
            rating >= 1
            and rating <= 5
        ),
        comment text,
        embedding vector(384),
        -- For sentiment analysis/grouping
        created_at timestamp with time zone default now()
);
-- 10. NOTIFICATIONS
create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade not null,
    tenant_id uuid references saloes(id) on delete cascade,
    title varchar not null,
    message text not null,
    read_at timestamp with time zone,
    created_at timestamp with time zone default now()
);
-- INDEXES
create index if not exists idx_clients_tenant on clients(tenant_id);
create index if not exists idx_services_tenant on services(tenant_id);
create index if not exists idx_appointments_tenant on appointments(tenant_id);
create index if not exists idx_appointments_start on appointments(start_time);
create index if not exists idx_inventory_tenant on inventory(tenant_id);
create index if not exists idx_finance_tenant on financial_transactions(tenant_id);
create index if not exists idx_notifications_user on notifications(user_id);
-- ENABLE ROW LEVEL SECURITY
alter table saloes enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table inventory enable row level security;
alter table financial_transactions enable row level security;
alter table marketing_campaigns enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
-- RLS POLICIES (Simplified for Multi-tenancy Pattern)
-- Users can see their own tenant
create policy "Users can view their own tenant" on saloes for
select using (
        id in (
            select tenant_id
            from profiles
            where id = auth.uid()
        )
    );
-- Profiles: Users can view profiles in their tenant
create policy "Users view profiles in tenant" on profiles for
select using (
        tenant_id in (
            select tenant_id
            from profiles
            where id = auth.uid()
        )
    );
-- Generic Tenant Policy Function
create or replace function get_auth_tenant() returns uuid language sql stable as $$
select tenant_id
from profiles
where id = auth.uid();
$$;
-- Apply to all tenant-scoped tables
-- Clients
create policy "Tenant isolation for clients" on clients using (tenant_id = get_auth_tenant());
-- Services
create policy "Tenant isolation for services" on services using (tenant_id = get_auth_tenant());
-- Appointments
create policy "Tenant isolation for appointments" on appointments using (tenant_id = get_auth_tenant());
-- Inventory
create policy "Tenant isolation for inventory" on inventory using (tenant_id = get_auth_tenant());
-- Financials
create policy "Tenant isolation for finance" on financial_transactions using (tenant_id = get_auth_tenant());
-- Campaigns
create policy "Tenant isolation for campaigns" on marketing_campaigns using (tenant_id = get_auth_tenant());
-- Reviews
create policy "Tenant isolation for reviews" on reviews using (tenant_id = get_auth_tenant());
-- Notifications (User scoped)
create policy "Users manage own notifications" on notifications using (user_id = auth.uid());
-- REALTIME CONFIGURATION
-- Enable realtime for appointments and notifications
begin;
drop publication if exists supabase_realtime;
create publication supabase_realtime;
commit;
alter publication supabase_realtime
add table appointments;
alter publication supabase_realtime
add table notifications;
alter publication supabase_realtime
add table inventory;
-- TRIGGERS
-- Auto-update updated_at timestamp
create or replace function update_updated_at_column() returns trigger as $$ begin new.updated_at = now();
return new;
end;
$$ language plpgsql;
create trigger update_saloes_modtime before
update on saloes for each row execute procedure update_updated_at_column();
create trigger update_profiles_modtime before
update on profiles for each row execute procedure update_updated_at_column();
create trigger update_clients_modtime before
update on clients for each row execute procedure update_updated_at_column();
create trigger update_services_modtime before
update on services for each row execute procedure update_updated_at_column();
create trigger update_appointments_modtime before
update on appointments for each row execute procedure update_updated_at_column();
create trigger update_inventory_modtime before
update on inventory for each row execute procedure update_updated_at_column();
-- LOGIC FUNCTIONS
-- Calculate Commission (Example)
create or replace function calculate_daily_commission(p_staff_id uuid, p_date date) returns decimal language plpgsql as $$
declare total_commission decimal = 0;
begin
select coalesce(sum(s.price * 0.10), 0) -- 10% commission default
    into total_commission
from appointments a
    join services s on a.service_id = s.id
where a.staff_id = p_staff_id
    and date(a.end_time) = p_date
    and a.status = 'completed';
return total_commission;
end;
$$;