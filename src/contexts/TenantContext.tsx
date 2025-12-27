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
    tenantId: string | null;  // Expose tenantId directly for easy access
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile, user } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenant = async () => {
            // First priority: get tenantId from profile
            if (profile?.tenant_id) {
                setTenantId(profile.tenant_id);

                try {
                    // Try to fetch tenant details from saloes table
                    const { data: saloesData } = await supabase
                        .from('saloes')
                        .select('*')
                        .eq('id', profile.tenant_id)
                        .single();

                    if (saloesData) {
                        setTenant(saloesData as Tenant);
                    } else {
                        // Fallback: try tenants table
                        const { data: tenantsData } = await supabase
                            .from('tenants')
                            .select('*')
                            .eq('id', profile.tenant_id)
                            .single();

                        if (tenantsData) {
                            setTenant(tenantsData as Tenant);
                        }
                    }
                } catch (err: any) {
                    console.warn('Error fetching tenant details:', err);
                    // tenantId is still set from profile, just no tenant details
                }
                setLoading(false);
                return;
            }

            // If no profile.tenant_id, try to create/assign a default tenant for this user
            if (user && !profile?.tenant_id) {
                try {
                    // Check if there's a tenant in the system - use first available
                    const { data: existingTenant } = await supabase
                        .from('tenants')
                        .select('id')
                        .limit(1)
                        .single();

                    if (existingTenant) {
                        // Update the user's profile with this tenant_id
                        await supabase
                            .from('profiles')
                            .update({ tenant_id: existingTenant.id })
                            .eq('id', user.id);

                        setTenantId(existingTenant.id);
                        console.log('Assigned tenant to user:', existingTenant.id);
                    } else {
                        // Create a new default tenant
                        const { data: newTenant, error: createError } = await supabase
                            .from('tenants')
                            .insert({
                                name: 'Meu Salão',
                                status: 'trial',
                                plan: 'free'
                            })
                            .select('id')
                            .single();

                        if (newTenant && !createError) {
                            // Assign to user profile
                            await supabase
                                .from('profiles')
                                .update({ tenant_id: newTenant.id })
                                .eq('id', user.id);

                            setTenantId(newTenant.id);
                            console.log('Created and assigned new tenant:', newTenant.id);
                        }
                    }
                } catch (err: any) {
                    console.error('Error setting up tenant:', err);
                    setError('Não foi possível configurar o estabelecimento.');
                }
            }

            setLoading(false);
        };

        if (user) {
            fetchTenant();
        } else {
            setTenantId(null);
            setTenant(null);
            setLoading(false);
        }
    }, [profile, user]);

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
