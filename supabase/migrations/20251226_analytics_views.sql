-- Analytics Views for Looker Studio
-- These views flatten relationships and provide easy-to-consume data for BI tools.
-- 1. Appointments View
-- Joins Appointments with Services, Professionals, and Clients for full context
CREATE OR REPLACE VIEW comp_analytics_appointments AS
SELECT a.id AS appointment_id,
    a.tenant_id,
    a.start_time,
    a.end_time,
    a.status,
    a.created_at,
    -- Duration in minutes
    EXTRACT(
        EPOCH
        FROM (a.end_time - a.start_time)
    ) / 60 AS duration_minutes,
    -- Dimensions
    s.name AS service_name,
    s.price AS service_price,
    p.name AS professional_name,
    c.id AS client_id,
    c.name AS client_name,
    -- Date dimensions for easier grouping
    TO_CHAR(a.start_time, 'YYYY-MM-DD') AS date_day,
    TO_CHAR(a.start_time, 'YYYY-MM') AS date_month,
    TO_CHAR(a.start_time, 'Day') AS day_of_week
FROM appointments a
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN profiles p ON a.professional_id = p.id
    LEFT JOIN clients c ON a.client_id = c.id;
-- 2. Financial Analytics View
-- Aggergates transactions and adds helpful categories
CREATE OR REPLACE VIEW comp_analytics_financial AS
SELECT t.id AS transaction_id,
    t.tenant_id,
    t.amount,
    t.type,
    -- 'income' or 'expense'
    t.category,
    t.description,
    t.date AS transaction_date,
    t.created_at,
    -- Date dimensions
    TO_CHAR(t.date, 'YYYY-MM-DD') AS date_day,
    TO_CHAR(t.date, 'YYYY-MM') AS date_month
FROM financial_transactions t;
-- 3. Client Analytics View
-- Metrics per client (LTV, Last Visit)
CREATE OR REPLACE VIEW comp_analytics_clients AS
SELECT c.id AS client_id,
    c.tenant_id,
    c.name,
    c.email,
    c.phone,
    c.created_at AS join_date,
    -- Calculated Metrics
    COUNT(a.id) AS total_appointments,
    MAX(a.start_time) AS last_visit_date,
    SUM(s.price) FILTER (
        WHERE a.status = 'completed'
    ) AS total_spend_estimated,
    -- Segmentation
    CASE
        WHEN MAX(a.start_time) < NOW() - INTERVAL '6 months' THEN 'Churn Risk'
        WHEN COUNT(a.id) > 5 THEN 'Loyal'
        ELSE 'Regular'
    END AS segment
FROM clients c
    LEFT JOIN appointments a ON c.id = a.client_id
    LEFT JOIN services s ON a.service_id = s.id
GROUP BY c.id,
    c.tenant_id,
    c.name,
    c.email,
    c.phone,
    c.created_at;
-- 4. Marketing Analytics View
-- Campaign performance
CREATE OR REPLACE VIEW comp_analytics_marketing AS
SELECT mc.id AS campaign_id,
    mc.tenant_id,
    mc.name AS campaign_name,
    mc.type AS channel,
    mc.status,
    mc.sent_count,
    mc.open_count,
    mc.click_count,
    mc.created_at,
    -- Calculated Rates
    CASE
        WHEN mc.sent_count > 0 THEN (mc.open_count::float / mc.sent_count) * 100
        ELSE 0
    END AS open_rate,
    CASE
        WHEN mc.sent_count > 0 THEN (mc.click_count::float / mc.sent_count) * 100
        ELSE 0
    END AS click_rate
FROM marketing_campaigns mc;
-- Permissions (Grant read access to authenticated setup, usually service_role in BI tools)
GRANT SELECT ON comp_analytics_appointments TO service_role;
GRANT SELECT ON comp_analytics_financial TO service_role;
GRANT SELECT ON comp_analytics_clients TO service_role;
GRANT SELECT ON comp_analytics_marketing TO service_role;
-- Note: In production, create a dedicated 'read_only_user' with stronger password and only granting SELECT on these views.