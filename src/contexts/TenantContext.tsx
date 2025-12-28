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
    tenantId: string | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Default mock tenant for development/demo when DB tables don't exist
const MOCK_TENANT: Tenant = {
    id: 'demo-tenant-id',
    name: 'Salão Demo',
    status: 'trial',
    plan: 'free'
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile, user, loading: authLoading } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn('[TenantContext] Timeout reached, using mock tenant');
                setTenantId(MOCK_TENANT.id);
                setTenant(MOCK_TENANT);
                setLoading(false);
            }
        }, 5000); // 5 second timeout

        const resolveTenant = async () => {
            console.log('[TenantContext] Starting tenant resolution...', {
                userId: user?.id,
                authLoading,
                profileTenantId: profile?.tenant_id
            });

            // Wait for auth to load first
            if (authLoading) {
                console.log('[TenantContext] Auth still loading, waiting...');
                return;
            }

            // No user = no tenant needed
            if (!user) {
                console.log('[TenantContext] No user logged in');
                setTenantId(null);
                setTenant(null);
                setLoading(false);
                return;
            }

            // Case 1: Profile has tenant_id
            if (profile?.tenant_id) {
                console.log('[TenantContext] Found tenant_id in profile:', profile.tenant_id);
                setTenantId(profile.tenant_id);

                // Try to get tenant details (but don't block on it)
                try {
                    const { data: tenantData } = await supabase
                        .from('saloes')
                        .select('*')
                        .eq('id', profile.tenant_id)
                        .single();

                    if (tenantData) {
                        setTenant(tenantData as Tenant);
                    }
                } catch (e) {
                    console.warn('[TenantContext] Could not fetch tenant details (table may not exist)');
                }

                setLoading(false);
                return;
            }

            // Case 2: User logged in but no tenant_id in profile
            // Use mock tenant for development/demo purposes
            console.log('[TenantContext] No tenant_id in profile, using mock tenant');
            setTenantId(MOCK_TENANT.id);
            setTenant(MOCK_TENANT);
            setError('Conta sem estabelecimento configurado. Usando dados de demonstração.');
            setLoading(false);
        };

        resolveTenant();

        return () => clearTimeout(timeout);
    }, [profile, user, authLoading]);

    return (
        <TenantContext.Provider value={{ tenant, tenantId, loading, error }}>
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

