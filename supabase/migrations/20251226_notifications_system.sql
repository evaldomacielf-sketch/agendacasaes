-- 20251226_notifications_system.sql
-- Schema for Intelligent Notification System (preferences, queue, templates)
-- 1. Notification Preferences
-- Stores user/client preferences for channels and types
create table if not exists notification_preferences (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references profiles(id) on delete cascade,
    -- If null, could be global default or specific anonymous client phone reference in future
    tenant_id uuid references saloes(id) on delete cascade not null,
    -- Channel Toggles
    email_enabled boolean default true,
    sms_enabled boolean default false,
    push_enabled boolean default true,
    whatsapp_enabled boolean default false,
    -- Notification Types
    reminders_enabled boolean default true,
    promotions_enabled boolean default true,
    system_alerts_enabled boolean default true,
    -- Schedule preferences (e.g. "Do not disturb" hours - simplified for now)
    start_quiet_hour int default 22,
    -- 22:00
    end_quiet_hour int default 8,
    -- 08:00
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(profile_id, tenant_id)
);
-- 2. Notification Templates
-- Templates for AI to use or fallback
create table if not exists notification_templates (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    name varchar not null,
    -- e.g., 'appointment_confirmation', 'reminder_24h'
    channel varchar not null,
    -- 'email', 'sms', 'push'
    subject_template text,
    -- For email/push title
    body_template text not null,
    -- Liquid or generic placeholders {{name}}
    is_active boolean default true,
    created_at timestamp with time zone default now()
);
-- 3. Notification Queue
-- Asynchronous queue for processing messages
create table if not exists notification_queue (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    -- Target
    user_id uuid references profiles(id) on delete
    set null,
        recipient_email varchar,
        recipient_phone varchar,
        -- Content
        title varchar,
        message text not null,
        channel varchar not null,
        -- 'email', 'sms', 'push'
        -- Metadata
        type varchar not null,
        -- 'confirmation', 'reminder', 'promotion', 'system'
        metadata jsonb default '{}'::jsonb,
        -- e.g. { appointment_id: "..." }
        -- Status
        status varchar default 'pending',
        -- pending, processing, sent, failed, cancelled
        priority int default 1,
        -- 1=Normal, 2=High
        -- Timing
        scheduled_for timestamp with time zone default now(),
        processed_at timestamp with time zone,
        error_log text,
        retry_count int default 0,
        created_at timestamp with time zone default now()
);
-- RLS Policies
-- Preferences
alter table notification_preferences enable row level security;
create policy "Users manage own preferences" on notification_preferences for all using (profile_id = auth.uid());
-- Templates
alter table notification_templates enable row level security;
create policy "Tenant read templates" on notification_templates for
select using (
        tenant_id = (
            select tenant_id
            from profiles
            where id = auth.uid()
        )
    );
-- Queue
alter table notification_queue enable row level security;
create policy "Tenant view queue" on notification_queue for
select using (
        tenant_id = (
            select tenant_id
            from profiles
            where id = auth.uid()
        )
    );
-- Indexes
create index if not exists idx_notif_pref_profile on notification_preferences(profile_id);
create index if not exists idx_notif_queue_status on notification_queue(status)
where status = 'pending';
create index if not exists idx_notif_queue_tenant on notification_queue(tenant_id);
-- Triggers
-- 1. Auto-Queue Confirmation on Appointment Insert
create or replace function queue_appointment_confirmation() returns trigger as $$ begin -- Only for new bookings
insert into notification_queue (
        tenant_id,
        user_id,
        -- Maps to client profile if exists, currently nullable
        recipient_email,
        -- We'll fetch from client table in a real complex trigger or let Edge Function handle expansion
        -- For simplicity in SQL trigger, we assume we want to trigger the Edge Function OR 
        -- insert a 'request' that the edge function picks up.
        -- HERE: We will simply insert into queue with minimal info, and let a separate process or the 'agent-notifications' process it.
        -- However, inserting directly requires fetching client info. 
        -- SIMPLIFICATION: We will rely on the "agent-notifications" being triggered by Webhook on APPOINTMENTS table, 
        -- rather than pure SQL logic, to allow Vertex AI generation.
        -- So this SQL trigger is generic fallback or for non-AI alerts.
        channel,
        type,
        message
    )
values (
        new.tenant_id,
        null,
        -- client_id link missing in queue schema above for simplicity, usually resolved via metadata
        'email',
        -- default
        'confirmation',
        'New appointment booked: ' || new.id
    );
return new;
end;
$$ language plpgsql;
-- Not enabling the SQL trigger above because we will use Supabase Database Webhooks 
-- to call 'agent-notifications' directly for richer logic.
-- This file establishes the storage structure.