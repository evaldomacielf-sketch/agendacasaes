-- Enhance marketing_campaigns for Segmentation and A/B Testing
alter table marketing_campaigns
add column if not exists segment_criteria jsonb default '{}'::jsonb,
    -- e.g. { "type": "churn", "days": 60 }
add column if not exists variations jsonb default '[]'::jsonb,
    -- Array of { subject, body, probability }
add column if not exists winner_variation_id int;
-- Create campaign_logs to track individual sends
create table if not exists campaign_logs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    campaign_id uuid references marketing_campaigns(id) on delete cascade not null,
    client_id uuid references clients(id) on delete cascade not null,
    variation_index int default 0,
    -- Which variant was sent (0 or 1)
    sent_at timestamp with time zone default now(),
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    status varchar default 'sent' -- sent, delivered, failed, opened
);
-- RLS
alter table campaign_logs enable row level security;
create policy "Tenant isolation for campaign_logs" on campaign_logs using (
    tenant_id in (
        select tenant_id
        from profiles
        where id = auth.uid()
    )
);
-- Index
create index idx_camp_logs_campaign on campaign_logs(campaign_id);
create index idx_camp_logs_client on campaign_logs(client_id);