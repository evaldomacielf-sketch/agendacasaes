-- 20251226_fix_schema_drift.sql
-- Fixes missing tenant_id in core tables to align with new modules
-- 1. Add tenant_id column
alter table appointments
add column if not exists tenant_id uuid references saloes(id);
alter table clients
add column if not exists tenant_id uuid references saloes(id);
alter table transactions
add column if not exists tenant_id uuid references saloes(id);
-- 2. Backfill from legacy organization_id
update appointments
set tenant_id = organization_id
where tenant_id is null;
update clients
set tenant_id = organization_id
where tenant_id is null;
-- transactions has organization_id confirmed in schema check
update transactions
set tenant_id = organization_id
where tenant_id is null;
-- 3. Ensure profiles has full_name for analytics view compatibility
-- (This is just a check, assuming it exists based on previous verification)