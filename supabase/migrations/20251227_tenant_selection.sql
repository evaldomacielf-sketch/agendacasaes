-- Migration: Add tenant selection infrastructure
-- Adds category and location to saloes, creates user_tenants junction table
-- 1. Add category and location columns to saloes
ALTER TABLE public.saloes
ADD COLUMN IF NOT EXISTS category text DEFAULT 'salao_beleza' CHECK (
        category IN (
            'barbearia',
            'salao_beleza',
            'estetica',
            'podologo',
            'unhas_gel',
            'outro'
        )
    ),
    ADD COLUMN IF NOT EXISTS endereco text,
    ADD COLUMN IF NOT EXISTS cidade text,
    ADD COLUMN IF NOT EXISTS estado text DEFAULT 'ES',
    ADD COLUMN IF NOT EXISTS logo_url text;
-- 2. Create user_tenants junction table for users with multiple tenants
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.saloes(id) ON DELETE CASCADE,
    role text DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_default boolean DEFAULT false,
    UNIQUE(user_id, tenant_id)
);
-- 3. Enable RLS on user_tenants
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
-- 4. RLS Policies for user_tenants
CREATE POLICY "Users can view their tenant associations" ON public.user_tenants FOR
SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners can manage tenant associations" ON public.user_tenants FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.user_tenants ut
        WHERE ut.tenant_id = user_tenants.tenant_id
            AND ut.user_id = auth.uid()
            AND ut.role = 'owner'
    )
);
-- 5. Function to get all tenants for a user
CREATE OR REPLACE FUNCTION public.get_user_tenants() RETURNS TABLE (
        tenant_id uuid,
        nome_salao text,
        category text,
        endereco text,
        cidade text,
        logo_url text,
        role text,
        is_default boolean
    ) AS $$ BEGIN RETURN QUERY
SELECT s.id as tenant_id,
    s.nome_salao,
    COALESCE(s.category, 'salao_beleza') as category,
    s.endereco,
    s.cidade,
    s.logo_url,
    COALESCE(ut.role, 'owner') as role,
    COALESCE(ut.is_default, true) as is_default
FROM public.saloes s
    LEFT JOIN public.user_tenants ut ON ut.tenant_id = s.id
    AND ut.user_id = auth.uid()
WHERE s.owner_id = auth.uid()
    OR ut.user_id = auth.uid()
ORDER BY ut.is_default DESC,
    s.nome_salao ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 6. Function to set active tenant for a user
CREATE OR REPLACE FUNCTION public.set_active_tenant(p_tenant_id uuid) RETURNS boolean AS $$
DECLARE v_has_access boolean;
BEGIN -- Check if user has access to this tenant
SELECT EXISTS (
        SELECT 1
        FROM public.saloes s
            LEFT JOIN public.user_tenants ut ON ut.tenant_id = s.id
        WHERE s.id = p_tenant_id
            AND (
                s.owner_id = auth.uid()
                OR ut.user_id = auth.uid()
            )
    ) INTO v_has_access;
IF NOT v_has_access THEN RETURN false;
END IF;
-- Update profile with the selected tenant
UPDATE public.profiles
SET tenant_id = p_tenant_id
WHERE id = auth.uid();
-- Mark as default in user_tenants
UPDATE public.user_tenants
SET is_default = (tenant_id = p_tenant_id)
WHERE user_id = auth.uid();
RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_tenant(uuid) TO authenticated;
-- 8. Migrate existing owner relationships to user_tenants
INSERT INTO public.user_tenants (user_id, tenant_id, role, is_default)
SELECT owner_id,
    id,
    'owner',
    true
FROM public.saloes
WHERE owner_id IS NOT NULL ON CONFLICT (user_id, tenant_id) DO NOTHING;