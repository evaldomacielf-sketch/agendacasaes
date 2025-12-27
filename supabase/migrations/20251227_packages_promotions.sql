-- 1. PROMOTIONS (Coupons)
create table if not exists promotions (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    code varchar not null,
    description text,
    discount_type varchar not null check (discount_type in ('percentage', 'fixed')),
    discount_value decimal(10, 2) not null,
    min_purchase_amount decimal(10, 2) default 0,
    max_uses integer,
    current_uses integer default 0,
    valid_from timestamp with time zone default now(),
    valid_until timestamp with time zone,
    applicable_services uuid [],
    -- Array of Service IDs
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    unique(tenant_id, code)
);
-- 2. PACKAGES (Bundles)
create table if not exists packages (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references saloes(id) on delete cascade not null,
    name varchar not null,
    description text,
    services uuid [],
    -- Array of Service IDs involved
    original_price decimal(10, 2),
    discounted_price decimal(10, 2),
    valid_from timestamp with time zone default now(),
    valid_until timestamp with time zone,
    is_active boolean default true,
    created_at timestamp with time zone default now()
);
-- 3. LOYALTY PROGRAM
alter table clients
add column if not exists loyalty_points integer default 0,
    add column if not exists lifetime_points integer default 0;
-- 4. APPOINTMENTS ENHANCEMENT
alter table appointments
add column if not exists promotion_id uuid references promotions(id),
    add column if not exists discount decimal(10, 2) default 0,
    add column if not exists final_price decimal(10, 2);
-- 5. FUNCTION: Apply Promotion
create or replace function apply_promotion(p_appointment_id uuid, p_code varchar) returns jsonb language plpgsql security definer as $$
declare v_appt record;
v_promo record;
v_service_price decimal(10, 2);
v_discount decimal(10, 2);
v_final_price decimal(10, 2);
begin -- Fetch Appointment
select * into v_appt
from appointments
where id = p_appointment_id;
if not found then return jsonb_build_object(
    'success',
    false,
    'message',
    'Agendamento não encontrado'
);
end if;
-- Fetch Service Price (if not in appt, fetch from services)
select price into v_service_price
from services
where id = v_appt.service_id;
-- Fetch Promotion
select * into v_promo
from promotions
where code = p_code
    and tenant_id = v_appt.tenant_id
    and is_active = true;
if not found then return jsonb_build_object('success', false, 'message', 'Cupom inválido');
end if;
-- Validate Dates
if now() < v_promo.valid_from
or (
    v_promo.valid_until is not null
    and now() > v_promo.valid_until
) then return jsonb_build_object('success', false, 'message', 'Cupom expirado');
end if;
-- Validate Usage
if v_promo.max_uses is not null
and v_promo.current_uses >= v_promo.max_uses then return jsonb_build_object('success', false, 'message', 'Cupom esgotado');
end if;
-- Validate Service Applicability
if v_promo.applicable_services is not null
and not (
    v_appt.service_id = any(v_promo.applicable_services)
) then return jsonb_build_object(
    'success',
    false,
    'message',
    'Cupom não aplicável a este serviço'
);
end if;
-- Calculate Discount
if v_promo.discount_type = 'percentage' then v_discount := (v_service_price * v_promo.discount_value) / 100;
else v_discount := v_promo.discount_value;
end if;
-- Cap discount at price? (Optional, but safe)
if v_discount > v_service_price then v_discount := v_service_price;
end if;
v_final_price := v_service_price - v_discount;
-- Update Appointment
update appointments
set promotion_id = v_promo.id,
    discount = v_discount,
    final_price = v_final_price
where id = p_appointment_id;
-- Increment Usage
update promotions
set current_uses = current_uses + 1
where id = v_promo.id;
return jsonb_build_object(
    'success',
    true,
    'discount',
    v_discount,
    'finalPrice',
    v_final_price
);
end;
$$;
-- 6. TRIGGER: Loyalty Points on Completion
create or replace function process_loyalty_points() returns trigger language plpgsql as $$
declare v_points integer;
begin -- Only runs when status changes to 'completed'
if new.status = 'completed'
and (
    old.status is null
    or old.status != 'completed'
) then -- Rule: 1 point per R$ 1.00 spent (using final_price or price)
-- If final_price is null (no promo), verify logic. we should ensure final_price is populated or fallback.
-- Let's populate final_price on insert trigger if null, or just coalesce here.
-- Actually, simpler: 1 point per integer currency unit.
-- Fetch price from service if final_price null?
-- Better to rely on what was actually paid.
-- Assuming appt update set final_price. If not, we need to fetch service price.
if new.final_price is not null then v_points := floor(new.final_price);
else
select floor(price) into v_points
from services
where id = new.service_id;
end if;
update clients
set loyalty_points = loyalty_points + v_points,
    lifetime_points = lifetime_points + v_points
where id = new.client_id;
end if;
return new;
end;
$$;
create trigger trigger_loyalty_points
after
update on appointments for each row execute procedure process_loyalty_points();
-- 7. RLS Policies
alter table promotions enable row level security;
alter table packages enable row level security;
create policy "Tenant isolation for promotions" on promotions using (
    tenant_id = (
        select tenant_id
        from profiles
        where id = auth.uid()
    )
);
create policy "Tenant isolation for packages" on packages using (
    tenant_id = (
        select tenant_id
        from profiles
        where id = auth.uid()
    )
);
-- Also allow public read if needed for booking page?
-- Yes, clients (anon or auth) need to read active promos/packages.
create policy "Public read active promotions" on promotions for
select using (true);
create policy "Public read active packages" on packages for
select using (true);