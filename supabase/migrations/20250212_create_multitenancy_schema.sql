-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- 1. Tenants Table (Salões)
create table if not exists public.saloes (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    nome_salao text not null,
    plano text default 'Trial' check (plano in ('Trial', 'Pro', 'Enterprise')),
    trial_start_date timestamp with time zone default timezone('utc'::text, now()),
    owner_id uuid references auth.users(id) -- The initial owner
);
-- 2. Profiles Table (Users linked to Tenants)
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    full_name text,
    role text default 'staff' check (role in ('admin', 'staff', 'owner')),
    tenant_id uuid references public.saloes(id) on delete cascade
);
-- 3. Tenant-Scoped Tables (Example: Clients, Services, Appointments) which might already exist partialy
-- ensuring they have tenant_id and RLS enabled.
-- Clients
create table if not exists public.clients (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    phone text,
    email text,
    tenant_id uuid references public.saloes(id) not null
);
-- Services
create table if not exists public.services (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    duration integer not null,
    -- in minutes
    price numeric(10, 2) not null,
    tenant_id uuid references public.saloes(id) not null
);
-- Appointments
create table if not exists public.appointments (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    status text default 'scheduled',
    client_id uuid references public.clients(id),
    service_id uuid references public.services(id),
    professional_id uuid references public.profiles(id),
    -- staff member
    tenant_id uuid references public.saloes(id) not null
);
-- 4. Enable Row Level Security (RLS)
alter table public.saloes enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
-- 5. RLS Policies
-- Helper function to get current user's tenant_id
create or replace function get_my_tenant_id() returns uuid as $$
select tenant_id
from public.profiles
where id = auth.uid()
limit 1;
$$ language sql security definer;
-- PROFILES Policies
-- Users can read their own profile
create policy "Users can read own profile" on public.profiles for
select using (auth.uid() = id);
-- SALOES Policies
-- Users can read the tenant they belong to
create policy "Users can read own tenant" on public.saloes for
select using (id = get_my_tenant_id());
-- CLIENTS Policies
create policy "Users can view clients of their tenant" on public.clients for
select using (tenant_id = get_my_tenant_id());
create policy "Users can insert clients for their tenant" on public.clients for
insert with check (tenant_id = get_my_tenant_id());
create policy "Users can update clients of their tenant" on public.clients for
update using (tenant_id = get_my_tenant_id());
-- SERVICES Policies
create policy "Users can view services of their tenant" on public.services for
select using (tenant_id = get_my_tenant_id());
create policy "Users can insert services for their tenant" on public.services for
insert with check (tenant_id = get_my_tenant_id());
-- APPOINTMENTS Policies
create policy "Users can view appointments of their tenant" on public.appointments for
select using (tenant_id = get_my_tenant_id());
create policy "Users can insert appointments for their tenant" on public.appointments for
insert with check (tenant_id = get_my_tenant_id());
create policy "Users can update appointments of their tenant" on public.appointments for
update using (tenant_id = get_my_tenant_id());
-- 6. Trigger to create Profile on User Signup (Optional but recommended)
-- This assumes you have valid logic to assign a tenant. 
-- For a SaaS, usually the signup process creates a Tenant + Owner Profile. 
-- Here we create a function that can be called via RPC or part of the signup flow.
create or replace function public.handle_new_user_signup(
        user_id uuid,
        user_email text,
        user_name text,
        salon_name text
    ) returns void as $$
declare new_tenant_id uuid;
begin -- 1. Create Tenant
insert into public.saloes (nome_salao, owner_id)
values (salon_name, user_id)
returning id into new_tenant_id;
-- 2. Create Profile linked to Tenant
insert into public.profiles (id, full_name, tenant_id, role)
values (user_id, user_name, new_tenant_id, 'owner');
end;
$$ language plpgsql security definer;