-- 1. ENHANCE REVIEWS TABLE
alter table reviews
add column if not exists service_rating integer check (
        service_rating between 1 and 5
    ),
    add column if not exists professional_rating integer check (
        professional_rating between 1 and 5
    ),
    add column if not exists would_recommend_service boolean default true,
    add column if not exists would_recommend_professional boolean default true,
    add column if not exists photos text [] default '{}';
-- 2. ENHANCE APPOINTMENTS & PROFILES (Google Integration)
alter table appointments
add column if not exists google_calendar_event_id text;
alter table profiles
add column if not exists google_calendar_id text,
    add column if not exists google_access_token text,
    add column if not exists google_refresh_token text;
-- 3. TRIGGER: Update Aggregates on Review
create or replace function update_ratings_aggregate() returns trigger as $$ begin -- Update Service Rating
    if new.service_rating is not null then
update services s
set review_count = (
        select count(*)
        from reviews
        where service_id = s.id
    ),
    rating = (
        select avg(service_rating)
        from reviews
        where service_id = s.id
    ) -- Assuming 'rating' column exists or handled by client
    -- Note: 'rating' column was not in original schema for services/profiles? 
    -- Checking schema: services has 'rating' (no, it didn't in 20251226_complete_saas_schema.sql, let me check strictness).
    -- Actually, I should add 'rating' and 'review_count' columns to Services and Profiles if they don't exist.
where id = new.service_id;
end if;
-- Update Professional Rating
if new.professional_rating is not null then
update profiles p
set -- We need to add rating/review_count columns to profiles first
    role = role -- No-op just to be safe if cols missing
where id = new.staff_id;
-- Note: reviews has 'client_id', 'appointment_id'. Does it have 'staff_id'?
-- Reviews table has: appointment_id. We can get staff_id from appointment.
-- Wait, schema says reviews has `appointment_id`, `client_id`... NO `staff_id` or `service_id` explicitly in reviews table in 20251226 schema?
-- Let's check 20251226 schema lines 122-137. It references Appt and Client.
-- To facilitate stats, let's ADD service_id and staff_id to Reviews for easier denormalization.
end if;
return new;
end;
$$ language plpgsql;
-- 3.b Fix Reviews Schema (Denormalization)
alter table reviews
add column if not exists service_id uuid references services(id),
    add column if not exists staff_id uuid references profiles(id);
-- 3.c Add Rating Columns to Services/Profiles
alter table services
add column if not exists rating decimal(3, 2) default 0,
    add column if not exists review_count integer default 0;
alter table profiles
add column if not exists rating decimal(3, 2) default 0,
    add column if not exists review_count integer default 0;
-- 3.d Real Update Aggregate Function
create or replace function update_ratings_aggregate() returns trigger as $$ begin -- Update Service
    if new.service_id is not null then
update services
set rating = (
        select coalesce(avg(service_rating), 0)
        from reviews
        where service_id = new.service_id
    ),
    review_count = (
        select count(*)
        from reviews
        where service_id = new.service_id
    )
where id = new.service_id;
end if;
-- Update Professional
if new.staff_id is not null then
update profiles
set rating = (
        select coalesce(avg(professional_rating), 0)
        from reviews
        where staff_id = new.staff_id
    ),
    review_count = (
        select count(*)
        from reviews
        where staff_id = new.staff_id
    )
where id = new.staff_id;
end if;
return new;
end;
$$ language plpgsql;
create trigger trigger_update_ratings
after
insert
    or
update on reviews for each row execute procedure update_ratings_aggregate();
-- 4. UPDATE REMINDER TRIGGER (Add Review Request)
create or replace function schedule_appointment_reminders() returns trigger as $$
declare appt_time timestamp with time zone;
end_time_val timestamp with time zone;
begin appt_time := new.start_time;
end_time_val := new.end_time;
-- Clear existing pending reminders if updating
if TG_OP = 'UPDATE' then
delete from scheduled_reminders
where appointment_id = new.id
    and status = 'pending';
end if;
-- T-7 Days (Email)
if appt_time - interval '7 days' > now() then
insert into scheduled_reminders (appointment_id, scheduled_time, channels)
values (
        new.id,
        appt_time - interval '7 days',
        array ['email']
    );
end if;
-- T-2 Days (SMS + Email)
if appt_time - interval '2 days' > now() then
insert into scheduled_reminders (appointment_id, scheduled_time, channels)
values (
        new.id,
        appt_time - interval '2 days',
        array ['sms', 'email']
    );
end if;
-- T-24 Hours (SMS + Email)
if appt_time - interval '1 day' > now() then
insert into scheduled_reminders (appointment_id, scheduled_time, channels)
values (
        new.id,
        appt_time - interval '1 day',
        array ['sms', 'email']
    );
end if;
-- T-1 Hour (SMS)
if appt_time - interval '1 hour' > now() then
insert into scheduled_reminders (appointment_id, scheduled_time, channels)
values (
        new.id,
        appt_time - interval '1 hour',
        array ['sms']
    );
end if;
-- T+0 (Start Time) - Push
if appt_time > now() then
insert into scheduled_reminders (appointment_id, scheduled_time, channels)
values (new.id, appt_time, array ['push']);
end if;
-- T+24h (After End Time) - Review Request (Email)
if end_time_val + interval '1 day' > now() then
insert into scheduled_reminders (appointment_id, scheduled_time, channels)
values (
        new.id,
        end_time_val + interval '1 day',
        array ['email']
    );
-- Logic in agent-notifications will detect if this is a "Review" based on time/status or generic logic
-- To be precise, we need a 'type' column in scheduled_reminders or infer it.
-- For now, we infer based on time > end_time.
end if;
return new;
end;
$$ language plpgsql;