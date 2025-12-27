import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface UserContext {
    user: any;
    profile: any;
    tenant_id: string;
}

export const getAuthenticatedUser = async (req: Request): Promise<{ user: any, supabase: SupabaseClient } | null> => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return null;

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return { user, supabase };
};

export const getTenantContext = async (supabase: SupabaseClient, userId: string): Promise<UserContext | null> => {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !profile || !profile.tenant_id) return null;

    return {
        user: { id: userId },
        profile,
        tenant_id: profile.tenant_id
    };
};
