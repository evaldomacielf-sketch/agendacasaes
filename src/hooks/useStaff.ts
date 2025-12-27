import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface StaffMember {
    id: string;
    full_name: string;
    email?: string;
    role: 'owner' | 'manager' | 'staff';
    specialties: string[];
    is_active: boolean;
    commission_rate?: number;
}

export const useStaff = (tenantId?: string | null) => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tenantId) {
            fetchStaff();
        } else {
            setStaff([]);
            setLoading(false);
        }
    }, [tenantId]);

    const fetchStaff = async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('tenant_id', tenantId)
                .in('role', ['staff', 'manager', 'owner'])
                .order('full_name');

            if (error) throw error;
            setStaff(data || []);
        } catch (e) {
            console.error('Error fetching staff:', e);
            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    const createStaff = async (data: Partial<StaffMember>) => {
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

