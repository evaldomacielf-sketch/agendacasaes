-- Performance Optimization Indices
-- 1. Appointments: Heavy filtering by tenants and date ranges
create index if not exists idx_appointments_tenant_dates on appointments(tenant_id, start_time);
create index if not exists idx_appointments_client on appointments(client_id);
-- 2. Clients: Fast lookup by tenant and email/phone (Auth/Signup check)
create index if not exists idx_clients_tenant_email on clients(tenant_id, email);
create index if not exists idx_clients_tenant_phone on clients(tenant_id, phone);
-- 3. Services: Frequent access for booking and listing
create index if not exists idx_services_tenant_active on services(tenant_id)
where active = true;
-- 4. Reviews: Filtering by tenant often
create index if not exists idx_reviews_tenant_created on reviews(tenant_id, created_at desc);
-- 5. Foreign Keys Indices (Supabase/Postgres doesn't auto-index FKs)
create index if not exists idx_appointments_service on appointments(service_id);
create index if not exists idx_appointments_professional on appointments(professional_id);
-- 6. Recommendation Logs: Analytics queries
create index if not exists idx_rec_logs_tenant_date on recommendation_logs(tenant_id, shown_at desc);