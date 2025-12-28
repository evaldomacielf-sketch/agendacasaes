-- Migration: Ensure all users have a tenant (salao)
-- This migration:
-- 1. Creates a default tenant for users who don't have one
-- 2. Adds public SELECT policy on services for booking page
-- 3. Adds an RPC function to auto-provision tenant for logged in user
-- 1. Function to auto-provision tenant for a user if they don't have one
CREATE OR REPLACE FUNCTION public.ensure_user_has_tenant(user_id uuid, user_email text DEFAULT NULL) RETURNS uuid AS $$
DECLARE current_tenant_id uuid;
new_tenant_id uuid;
user_name text;
BEGIN -- Check if user already has a tenant
SELECT tenant_id INTO current_tenant_id
FROM public.profiles
WHERE id = user_id;
IF current_tenant_id IS NOT NULL THEN RETURN current_tenant_id;
END IF;
-- Get user's name from profiles if exists
SELECT full_name INTO user_name
FROM public.profiles
WHERE id = user_id;
-- Create a new default tenant for this user
INSERT INTO public.saloes (nome_salao, owner_id, plano)
VALUES (
        COALESCE(user_name, user_email, 'Meu Salão') || '''s Salon',
        user_id,
        'Trial'
    )
RETURNING id INTO new_tenant_id;
-- Update or create profile with tenant_id
INSERT INTO public.profiles (id, tenant_id, role, full_name)
VALUES (
        user_id,
        new_tenant_id,
        'owner',
        COALESCE(user_name, user_email)
    ) ON CONFLICT (id) DO
UPDATE
SET tenant_id = new_tenant_id,
    role = COALESCE(profiles.role, 'owner');
RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.ensure_user_has_tenant(uuid, text) TO authenticated;
-- 3. Add public read policy for services (for booking page)
-- First drop if exists to avoid error
DO $$ BEGIN DROP POLICY IF EXISTS "Public can view active services" ON public.services;
EXCEPTION
WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Public can view active services" ON public.services FOR
SELECT TO anon,
    authenticated USING (true);
-- 4. Add public read policy for saloes (for public tenant lookup)
DO $$ BEGIN DROP POLICY IF EXISTS "Public can view saloes basic info" ON public.saloes;
EXCEPTION
WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Public can view saloes basic info" ON public.saloes FOR
SELECT TO anon,
    authenticated USING (true);
-- 5. If the clients table uses 'full_name' instead of 'name', add an alias column
-- Check if 'name' column exists, if not create it
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clients'
        AND column_name = 'name'
) THEN -- Add name column if it doesn't exist
ALTER TABLE public.clients
ADD COLUMN name text;
END IF;
END $$;
-- 6. Ensure profiles table allows users to update their own tenant_id
-- (needed for auto-provisioning)
DO $$ BEGIN DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
EXCEPTION
WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- 7. Ensure profiles table allows insert for new users
DO $$ BEGIN DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
EXCEPTION
WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (auth.uid() = id);