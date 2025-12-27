import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

interface Tenant {
    id: string;
    name: string;
    slug?: string;
    logo_url?: string;
    plan?: string;
    status: 'active' | 'inactive' | 'trial';
}

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenant = async () => {
            if (!profile?.tenant_id) {
                setLoading(false);
                return;
            }

            try {
                // Fetch tenant details from 'saloes' (assuming this is the tenants table based on previous context)
                // Adjust table name if it's strictly 'tenants' in a different schema, but 'saloes' was referenced in BookingPage.
                const { data, error } = await supabase
                    .from('saloes')
                    .select('*')
                    .eq('id', profile.tenant_id)
                    .single();

                if (error) {
                    console.error('Error fetching tenant:', error);
                    setError('Falha ao carregar dados do estabelecimento.');
                    setTenant(null);
                } else {
                    setTenant(data as Tenant);
                }
            } catch (err: any) {
                console.error('Unexpected error fetching tenant:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (profile) {
            fetchTenant();
        } else {
            setLoading(false); // No profile, no tenant loading needed
        }
    }, [profile]);

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant deve ser usado dentro de um TenantProvider');
    }
    return context;
};
