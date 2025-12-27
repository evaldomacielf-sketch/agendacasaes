-- 20251226_integrations_schema.sql
-- 1. Tenant Integrations Config
-- Stores which integrations are enabled for the salon
create table if not exists tenant_integrations (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    provider varchar not null,
    -- 'google_calendar', 'whatsapp', 'instagram'
    is_enabled boolean default false,
    settings jsonb default '{}'::jsonb,
    -- Public settings (e.g. 'whatsapp_phone_number_display')
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(tenant_id, provider)
);
-- 2. User Integrations (OAuth Tokens)
-- Stores tokens per user (e.g., each barber syncs their own Calendar)
create table if not exists user_integrations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade not null,
    provider varchar not null,
    -- 'google_calendar'
    -- Encrypted tokens (In production, use Vault or PGP. Here we rely on RLS)
    access_token text,
    refresh_token text,
    expires_at timestamp with time zone,
    scope text,
    metadata jsonb default '{}'::jsonb,
    -- e.g. calendar_id
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, provider)
);
-- 3. Sync Logs
create table if not exists integration_logs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    provider varchar not null,
    event varchar not null,
    -- 'sync_start', 'sync_success', 'error'
    details text,
    created_at timestamp with time zone default now()
);
-- RLS
alter table tenant_integrations enable row level security;
alter table user_integrations enable row level security;
alter table integration_logs enable row level security;
-- Policies
create policy "Tenant read integrations" on tenant_integrations for
select using (
        tenant_id = (
            select tenant_id
            from profiles
            where id = auth.uid()
        )
    );
create policy "Users manage own tokens" on user_integrations for all using (user_id = auth.uid());
create policy "Tenant view logs" on integration_logs for
select using (
        tenant_id = (
            select tenant_id
            from profiles
            where id = auth.uid()
        )
    );