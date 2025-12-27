-- Migration: Enhance scheduled_reminders for Phase 1 Notifications
-- Adds type, tenant_id, and sent_at columns for dashboard and filtering
-- 1. Add new columns
ALTER TABLE scheduled_reminders
ADD COLUMN IF NOT EXISTS type varchar DEFAULT 'reminder';
ALTER TABLE scheduled_reminders
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES saloes(id);
ALTER TABLE scheduled_reminders
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone;
-- 2. Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_reminders_tenant_status ON scheduled_reminders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_reminders_sent_at ON scheduled_reminders(sent_at);
-- 3. Update trigger to populate tenant_id and add confirmation
CREATE OR REPLACE FUNCTION schedule_appointment_reminders() RETURNS trigger AS $$
DECLARE appt_time timestamp with time zone;
appt_tenant_id uuid;
BEGIN appt_time := NEW.start_time;
-- Get tenant_id from the service linked to this appointment
SELECT s.tenant_id INTO appt_tenant_id
FROM services s
WHERE s.id = NEW.service_id;
-- Clear existing pending reminders if updating (e.g. rescheduled)
IF TG_OP = 'UPDATE' THEN
DELETE FROM scheduled_reminders
WHERE appointment_id = NEW.id
    AND status = 'pending';
END IF;
-- T+0: Immediate Confirmation (on INSERT only)
IF TG_OP = 'INSERT' THEN
INSERT INTO scheduled_reminders (
        appointment_id,
        scheduled_time,
        channels,
        type,
        tenant_id
    )
VALUES (
        NEW.id,
        now(),
        ARRAY ['email'],
        'confirmation',
        appt_tenant_id
    );
END IF;
-- T-7 Days (Email Reminder)
IF appt_time - interval '7 days' > now() THEN
INSERT INTO scheduled_reminders (
        appointment_id,
        scheduled_time,
        channels,
        type,
        tenant_id
    )
VALUES (
        NEW.id,
        appt_time - interval '7 days',
        ARRAY ['email'],
        'reminder',
        appt_tenant_id
    );
END IF;
-- T-2 Days (SMS + Email)
IF appt_time - interval '2 days' > now() THEN
INSERT INTO scheduled_reminders (
        appointment_id,
        scheduled_time,
        channels,
        type,
        tenant_id
    )
VALUES (
        NEW.id,
        appt_time - interval '2 days',
        ARRAY ['sms', 'email'],
        'reminder',
        appt_tenant_id
    );
END IF;
-- T-24 Hours (SMS + Email)
IF appt_time - interval '1 day' > now() THEN
INSERT INTO scheduled_reminders (
        appointment_id,
        scheduled_time,
        channels,
        type,
        tenant_id
    )
VALUES (
        NEW.id,
        appt_time - interval '1 day',
        ARRAY ['sms', 'email'],
        'reminder',
        appt_tenant_id
    );
END IF;
-- T-1 Hour (SMS)
IF appt_time - interval '1 hour' > now() THEN
INSERT INTO scheduled_reminders (
        appointment_id,
        scheduled_time,
        channels,
        type,
        tenant_id
    )
VALUES (
        NEW.id,
        appt_time - interval '1 hour',
        ARRAY ['sms'],
        'reminder',
        appt_tenant_id
    );
END IF;
-- T+0 (Start Time) - Push Notification
IF appt_time > now() THEN
INSERT INTO scheduled_reminders (
        appointment_id,
        scheduled_time,
        channels,
        type,
        tenant_id
    )
VALUES (
        NEW.id,
        appt_time,
        ARRAY ['push'],
        'reminder',
        appt_tenant_id
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 4. Recreate Trigger
DROP TRIGGER IF EXISTS trigger_schedule_reminders ON appointments;
CREATE TRIGGER trigger_schedule_reminders
AFTER
INSERT
    OR
UPDATE OF start_time ON appointments FOR EACH ROW EXECUTE PROCEDURE schedule_appointment_reminders();
-- 5. Backfill tenant_id for existing records (one-time)
UPDATE scheduled_reminders sr
SET tenant_id = s.tenant_id
FROM appointments a
    JOIN services s ON a.service_id = s.id
WHERE sr.appointment_id = a.id
    AND sr.tenant_id IS NULL;