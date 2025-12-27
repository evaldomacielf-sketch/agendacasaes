-- Add analysis column to reviews to store AI results
alter table reviews
add column if not exists analysis jsonb default '{}'::jsonb,
    add column if not exists sentiment_score float;
-- -1.0 to 1.0
-- Create table for aggregated insights (Batch analysis results)
create table if not exists feedback_insights (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    period_start date,
    period_end date,
    summary text,
    full_report jsonb,
    -- Detailed topics, strengths, weaknesses
    created_at timestamp with time zone default now()
);
-- RLS
alter table feedback_insights enable row level security;
create policy "Tenant isolation for feedback_insights" on feedback_insights using (
    tenant_id in (
        select tenant_id
        from profiles
        where id = auth.uid()
    )
);