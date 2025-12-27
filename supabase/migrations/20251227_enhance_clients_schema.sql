-- 20251227_enhance_clients_schema.sql
-- Description: Adds detailed client fields for the Booking Flow Step 3 (Confirmation).
-- 1. Add new columns to clients table
alter table clients
add column if not exists gender varchar(20),
    -- 'M', 'F', 'Other'
add column if not exists address text,
    add column if not exists preferences jsonb default '{
  "notificationChannels": ["email"],
  "preferredProfessional": null
}'::jsonb;
-- 2. Add full text search index (optional, good for checking existing clients)
create index if not exists idx_clients_email on clients(email);
create index if not exists idx_clients_phone on clients(phone);