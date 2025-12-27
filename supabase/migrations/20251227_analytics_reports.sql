create or replace function get_advanced_report(
        p_tenant_id uuid,
        p_start_date timestamp with time zone,
        p_end_date timestamp with time zone
    ) returns jsonb language plpgsql stable security definer as $$
declare -- Summary Vars
    v_total_appts integer;
v_completed_appts integer;
v_cancelled_appts integer;
v_noshow_appts integer;
v_total_revenue decimal(10, 2);
v_new_clients integer;
v_recurring_clients integer;
-- Collections
v_by_service jsonb;
v_by_professional jsonb;
v_satisfaction jsonb;
begin -- 1. SUMMARY STATS
select count(*),
    count(*) filter (
        where status = 'completed'
    ),
    count(*) filter (
        where status = 'cancelled'
    ),
    count(*) filter (
        where status = 'no_show'
    ),
    coalesce(
        sum(coalesce(final_price, price)) filter (
            where status = 'completed'
        ),
        0
    ) into v_total_appts,
    v_completed_appts,
    v_cancelled_appts,
    v_noshow_appts,
    v_total_revenue
from appointments a
    left join services s on a.service_id = s.id -- Fallback price if needed
where a.tenant_id = p_tenant_id
    and a.start_time >= p_start_date
    and a.start_time <= p_end_date;
-- New Clients (Created in period)
select count(*) into v_new_clients
from clients
where tenant_id = p_tenant_id
    and created_at >= p_start_date
    and created_at <= p_end_date;
-- Recurring (Active in period but created before)
-- Simplified definition: Clients with appts in period who were created before period
select count(distinct client_id) into v_recurring_clients
from appointments a
    join clients c on a.client_id = c.id
where a.tenant_id = p_tenant_id
    and a.start_time >= p_start_date
    and a.start_time <= p_end_date
    and c.created_at < p_start_date;
-- 2. REVENUE BY SERVICE
select jsonb_agg(row_to_json(t)) into v_by_service
from (
        select s.name as "serviceName",
            count(*) as "appointmentCount",
            sum(coalesce(a.final_price, s.price)) as revenue,
            round(
                (count(*) * 100.0 / nullif(v_completed_appts, 0)),
                1
            ) as percentage -- % of volume
        from appointments a
            join services s on a.service_id = s.id
        where a.tenant_id = p_tenant_id
            and a.status = 'completed'
            and a.start_time >= p_start_date
            and a.start_time <= p_end_date
        group by s.id,
            s.name
        order by revenue desc
    ) t;
-- 3. REVENUE BY PROFESSIONAL
select jsonb_agg(row_to_json(t)) into v_by_professional
from (
        select p.full_name as "professionalName",
            count(*) as "appointmentCount",
            sum(coalesce(a.final_price, s.price)) as revenue,
            -- Extract commission % from jsonb, default 30
            sum(coalesce(a.final_price, s.price)) * (
                coalesce((p.commission->>'value')::decimal, 30) / 100
            ) as commission
        from appointments a
            join profiles p on a.staff_id = p.id
            left join services s on a.service_id = s.id
        where a.tenant_id = p_tenant_id
            and a.status = 'completed'
            and a.start_time >= p_start_date
            and a.start_time <= p_end_date
        group by p.id,
            p.full_name,
            p.commission
        order by revenue desc
    ) t;
-- 4. SATISFACTION (Reviews linked to appointments in period)
-- Note: Reviews might be written LATER, but we usually analyze "Services performed in period X"
-- Or "Reviews written in period X". Let's do "Reviews for appointments in period X"
select row_to_json(t) into v_satisfaction
from (
        select round(avg(r.service_rating), 1) as "averageRating",
            count(*) filter (
                where r.service_rating >= 4
            ) as "positiveReviews",
            count(*) filter (
                where r.service_rating = 3
            ) as "neutralReviews",
            count(*) filter (
                where r.service_rating < 3
            ) as "negativeReviews",
            count(*) as "totalReviews"
        from reviews r
            join appointments a on r.appointment_id = a.id
        where a.tenant_id = p_tenant_id
            and a.start_time >= p_start_date
            and a.start_time <= p_end_date
    ) t;
-- 5. BUILD RESULT
return jsonb_build_object(
    'summary',
    jsonb_build_object(
        'totalAppointments',
        v_total_appts,
        'completedAppointments',
        v_completed_appts,
        'cancelledAppointments',
        v_cancelled_appts,
        'noShows',
        v_noshow_appts,
        'attendanceRate',
        case
            when v_total_appts > 0 then round(
                (v_completed_appts::decimal / v_total_appts) * 100,
                1
            )
            else 0
        end,
        'totalRevenue',
        v_total_revenue,
        'averageTicket',
        case
            when v_completed_appts > 0 then round(v_total_revenue / v_completed_appts, 2)
            else 0
        end,
        'newClients',
        v_new_clients,
        'recurringClients',
        v_recurring_clients
    ),
    'revenueByService',
    coalesce(v_by_service, '[]'::jsonb),
    'revenueByProfessional',
    coalesce(v_by_professional, '[]'::jsonb),
    'clientSatisfaction',
    v_satisfaction
);
end;
$$;