-- 1. Scheduled Reminders Table
create table if not exists scheduled_reminders (
    id uuid primary key default gen_random_uuid(),
    appointment_id uuid references appointments(id) on delete cascade not null,
    scheduled_time timestamp with time zone not null,
    status varchar default 'pending',
    -- pending, sent, failed, cancelled
    channels text [] not null,
    -- ['email', 'sms', 'whatsapp', 'push']
    created_at timestamp with time zone default now()
);
-- Index for efficient polling
create index if not exists idx_reminders_status_time on scheduled_reminders(status, scheduled_time);
-- 2. Trigger Function to Auto-Schedule
create or replace function schedule_appointment_reminders() returns trigger as $$
declare appt_time timestamp with time zone;
begin appt_time := new.start_time;
-- Clear existing pending reminders if updating (e.g. rescheduled)
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
-- T+0 (Start Time) - Push Notification
if appt_time > now() then
insert into scheduled_reminders (appointment_id, scheduled_time, channels)
values (new.id, appt_time, array ['push']);
end if;
return new;
end;
$$ language plpgsql;
-- 3. Trigger Definition
drop trigger if exists trigger_schedule_reminders on appointments;
create trigger trigger_schedule_reminders
after
insert
    or
update of start_time on appointments for each row execute procedure schedule_appointment_reminders();