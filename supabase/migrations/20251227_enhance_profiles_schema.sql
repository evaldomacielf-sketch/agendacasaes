-- 20251227_enhance_profiles_schema.sql
-- Description: Adds rich metadata columns to profiles table for the Booking Flow Step 2 (Professional Selection).
-- 1. Add new columns
alter table profiles
add column if not exists specialties text [] default '{}',
    add column if not exists rating decimal(3, 1) default 4.8,
    add column if not exists review_count integer default 0,
    add column if not exists bio text,
    add column if not exists is_active boolean default true,
    add column if not exists working_hours jsonb default '[
  {"day": 1, "start": "09:00", "end": "18:00"},
  {"day": 2, "start": "09:00", "end": "18:00"},
  {"day": 3, "start": "09:00", "end": "18:00"},
  {"day": 4, "start": "09:00", "end": "18:00"},
  {"day": 5, "start": "09:00", "end": "18:00"},
  {"day": 6, "start": "09:00", "end": "14:00"}
]'::jsonb;
-- 2. Backfill/Seed minimal data for demonstration
-- Update all staff/admins to have default working hours and mock rating if null
update profiles
set rating = 4.9,
    specialties = ARRAY ['Cabelo', 'Coloração'],
    bio = 'Especialista em cortes modernos e visagismo.'
where role in ('staff', 'owner', 'manager')
    and rating is null;
-- Ensure we have at least one test professional linked to the first tenant
-- (This relies on existing profiles. If none exist, they must be created via Auth)