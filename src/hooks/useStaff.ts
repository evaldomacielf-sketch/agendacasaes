import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface StaffMember {
    id: string;
    full_name: string;
    email?: string;
    role: 'owner' | 'manager' | 'staff';
    specialties: string[];
    is_active: boolean;
    commission_rate?: number; // Custom field to be added to profiles?
}

export const useStaff = () => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (!profile) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('tenant_id', profile.tenant_id)
                .in('role', ['staff', 'manager', 'owner'])
                .order('full_name');

            if (error) throw error;
            setStaff(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const createStaff = async (data: Partial<StaffMember>) => {
        // In a real app, this would invite the user or create a user in Auth.
        // For MVP, we might just insert a profile if the user already exists or use a trigger.
        // But profiles are linked to auth.users. 
        // Simplification: We cannot create a 'profile' without an 'auth.user' usually.
        // We will assume for this MVP that we are just updating existing profiles or using a special 'staff' table if defined?
        // The prompt says "Tabela de profissionais... CRUD básico".
        // If 'profiles' is 1:1 with auth, we can't just 'create' one easily without email invite.
        // Let's just Return a mock success for creation to satisfy UI if we can't hit an edge function for invite.
        // OR better: Just insert into 'profiles' is blocked by FK usually. 
        // Let's assume we update logic later or use a separate 'staff' table if this is a problem.
        // Existing schema check: 'saloes', 'profiles'.
        // Let's use `admin_professionals_view` which implies `profiles`.
        alert("Para criar um profissional real, seria necessário um fluxo de convite por email (Auth). Implementação simulada.");
    };

    const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
        try {
            const { error } = await supabase.from('profiles').update(updates).eq('id', id);
            if (error) throw error;
            await fetchStaff();
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    };

    return { staff, loading, createStaff, updateStaff, refetch: fetchStaff };
};
