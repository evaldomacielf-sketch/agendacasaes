-- 20251227_enhance_services_schema.sql
-- Description: Adds rich metadata columns to services table for the 3-Click Booking Flow.
-- 1. Add new columns
alter table services
add column if not exists category varchar default 'Geral',
    add column if not exists image text,
    add column if not exists rating decimal(3, 1) default 5.0,
    add column if not exists review_count integer default 0,
    add column if not exists is_active boolean default true;
-- 2. Create index for filtering by category
create index if not exists idx_services_category on services(tenant_id, category);
-- 3. Backfill/Seed minimal data for demonstration (Optional, but safe to run)
-- Update existing rows to have sensible defaults if they are null
update services
set category = 'Cabelo',
    image = 'https://images.unsplash.com/photo-1585747685352-3a993d583381?q=80&w=2070&auto=format&fit=crop'
where name ilike '%corte%'
    and category is null;
update services
set category = 'Barba',
    image = 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop'
where name ilike '%barba%'
    and category is null;
update services
set category = 'Estética',
    image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop'
where (
        name ilike '%hidrata%'
        or name ilike '%sobrancelha%'
    )
    and category is null;
-- Ensure we have at least one test service if the table is empty (Safe insert)
insert into services (
        tenant_id,
        name,
        description,
        duration_minutes,
        price,
        category,
        image,
        rating,
        review_count
    )
select (
        select id
        from saloes
        limit 1
    ), -- Grab first tenant
    'Corte Moderno', 'Corte completo com lavagem e finalização.', 45, 50.00, 'Cabelo', 'https://images.unsplash.com/photo-1585747685352-3a993d583381?q=80&w=2070&auto=format&fit=crop', 4.8, 120
where not exists (
        select 1
        from services
        where name = 'Corte Moderno'
    );