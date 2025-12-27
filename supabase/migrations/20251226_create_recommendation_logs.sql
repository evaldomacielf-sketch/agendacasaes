-- Create table for tracking AI recommendations and user interactions
create table if not exists recommendation_logs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    client_id uuid references clients(id) on delete cascade not null,
    service_id uuid references services(id) on delete cascade not null,
    score float,
    -- AI confidence score
    shown_at timestamp with time zone default now(),
    clicked_at timestamp with time zone,
    converted_at timestamp with time zone,
    -- If they actually booked it
    status varchar default 'shown' -- shown, clicked, converted, dismissed
);
-- RLS
alter table recommendation_logs enable row level security;
create policy "Tenant isolation for recommendation_logs" on recommendation_logs using (
    tenant_id in (
        select tenant_id
        from profiles
        where id = auth.uid()
    )
);
-- Index for analytics
create index idx_rec_logs_client on recommendation_logs(client_id);
create index idx_rec_logs_service on recommendation_logs(service_id);