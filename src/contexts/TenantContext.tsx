import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

interface Tenant {
    id: string;
    nome_salao: string;  // Match DB column name
    plano?: string;
    owner_id?: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    tenantId: string | null;
    tenantName: string | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile, user, loading: authLoading } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [tenantName, setTenantName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Guard against infinite loading
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn('[TenantContext] Timeout reached');
                setError('Tempo esgotado ao carregar estabelecimento');
                setLoading(false);
            }
        }, 10000);

        const resolveTenant = async () => {
            console.log('[TenantContext] Resolving tenant...', {
                userId: user?.id,
                authLoading,
                profileTenantId: profile?.tenant_id
            });

            // Wait for auth to complete
            if (authLoading) {
                return;
            }

            // No user logged in
            if (!user) {
                console.log('[TenantContext] No user, clearing tenant');
                setTenantId(null);
                setTenantName(null);
                setTenant(null);
                setError(null);
                setLoading(false);
                return;
            }

            // Try to get tenant from profile
            if (profile?.tenant_id) {
                console.log('[TenantContext] Profile has tenant_id:', profile.tenant_id);
                setTenantId(profile.tenant_id);

                // Fetch tenant details from saloes
                try {
                    const { data: salaoData, error: salaoError } = await supabase
                        .from('saloes')
                        .select('*')
                        .eq('id', profile.tenant_id)
                        .single();

                    if (salaoData && !salaoError) {
                        console.log('[TenantContext] Loaded salao:', salaoData.nome_salao);
                        setTenant(salaoData);
                        setTenantName(salaoData.nome_salao);
                        setError(null);
                    } else {
                        console.warn('[TenantContext] Could not load salao details');
                        setTenantName('Meu Estabelecimento');
                    }
                } catch (e) {
                    console.warn('[TenantContext] Error fetching salao:', e);
                    setTenantName('Meu Estabelecimento');
                }

                setLoading(false);
                return;
            }

            // User logged in but no tenant_id - try to auto-provision
            console.log('[TenantContext] No tenant_id in profile, attempting auto-provision...');
            try {
                const { data: newTenantId, error: rpcError } = await supabase
                    .rpc('ensure_user_has_tenant', {
                        user_id: user.id,
                        user_email: user.email
                    });

                if (newTenantId && !rpcError) {
                    console.log('[TenantContext] Auto-provisioned tenant:', newTenantId);
                    setTenantId(newTenantId);

                    // Fetch the new tenant details
                    const { data: salaoData } = await supabase
                        .from('saloes')
                        .select('*')
                        .eq('id', newTenantId)
                        .single();

                    if (salaoData) {
                        setTenant(salaoData);
                        setTenantName(salaoData.nome_salao);
                    } else {
                        setTenantName('Meu Estabelecimento');
                    }
                    setError(null);
                } else {
                    console.error('[TenantContext] Failed to auto-provision:', rpcError);
                    setError('Não foi possível configurar seu estabelecimento. Contate o suporte.');
                }
            } catch (e: any) {
                console.error('[TenantContext] Auto-provision error:', e);
                setError('Erro ao configurar estabelecimento: ' + (e.message || 'Erro desconhecido'));
            }

            setLoading(false);
        };

        resolveTenant();

        return () => clearTimeout(timeout);
    }, [profile, user, authLoading]);

    return (
        <TenantContext.Provider value={{ tenant, tenantId, tenantName, loading, error }}>
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
