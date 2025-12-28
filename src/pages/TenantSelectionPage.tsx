import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

interface TenantOption {
    tenant_id: string;
    nome_salao: string;
    category: string;
    endereco: string | null;
    cidade: string | null;
    logo_url: string | null;
    role: string;
    is_default: boolean;
}

// Category display names and icons
const CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
    barbearia: { name: 'Barbearia', icon: 'content_cut', color: 'from-blue-500 to-blue-700' },
    salao_beleza: { name: 'Salão de Beleza', icon: 'spa', color: 'from-pink-500 to-rose-600' },
    estetica: { name: 'Estética', icon: 'face_retouching_natural', color: 'from-purple-500 to-violet-600' },
    podologo: { name: 'Podólogo', icon: 'healing', color: 'from-teal-500 to-cyan-600' },
    unhas_gel: { name: 'Unhas em Gel', icon: 'gesture', color: 'from-red-400 to-pink-500' },
    outro: { name: 'Outros', icon: 'store', color: 'from-gray-500 to-slate-600' }
};

const TenantSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { selectTenant } = useTenant();

    const [tenants, setTenants] = useState<TenantOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selecting, setSelecting] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        if (user) {
            loadTenants();
        }
    }, [user, authLoading]);

    const loadTenants = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try RPC first
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_tenants');

            if (rpcData && !rpcError) {
                setTenants(rpcData);

                // If only one tenant, select automatically
                if (rpcData.length === 1) {
                    handleSelectTenant(rpcData[0]);
                    return;
                }
            } else {
                // Fallback: query saloes directly
                console.warn('RPC not available, using fallback query');
                const { data: saloesData, error: saloesError } = await supabase
                    .from('saloes')
                    .select('*')
                    .or(`owner_id.eq.${user!.id}`);

                if (saloesData && !saloesError) {
                    const mapped = saloesData.map(s => ({
                        tenant_id: s.id,
                        nome_salao: s.nome_salao,
                        category: s.category || 'salao_beleza',
                        endereco: s.endereco || null,
                        cidade: s.cidade || null,
                        logo_url: s.logo_url || null,
                        role: 'owner',
                        is_default: true
                    }));
                    setTenants(mapped);

                    if (mapped.length === 1) {
                        handleSelectTenant(mapped[0]);
                        return;
                    }
                } else {
                    setError('Não foi possível carregar seus estabelecimentos');
                }
            }
        } catch (e: any) {
            console.error('Error loading tenants:', e);
            setError(e.message || 'Erro ao carregar estabelecimentos');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTenant = async (tenant: TenantOption) => {
        setSelecting(tenant.tenant_id);

        try {
            // Try RPC first
            const { error: rpcError } = await supabase.rpc('set_active_tenant', {
                p_tenant_id: tenant.tenant_id
            });

            if (rpcError) {
                // Fallback: update profile directly
                await supabase
                    .from('profiles')
                    .update({ tenant_id: tenant.tenant_id })
                    .eq('id', user!.id);
            }

            // Update context
            if (selectTenant) {
                selectTenant(tenant.tenant_id, tenant.nome_salao);
            }

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (e: any) {
            console.error('Error selecting tenant:', e);
            setError('Erro ao selecionar estabelecimento');
            setSelecting(null);
        }
    };

    // Group tenants by category
    const groupedTenants = tenants.reduce((acc, tenant) => {
        const cat = tenant.category || 'outro';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(tenant);
        return acc;
    }, {} as Record<string, TenantOption[]>);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-900 dark:to-primary/10 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-300">Carregando estabelecimentos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-900 dark:to-primary/10 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-red-600">error</span>
                    </div>
                    <h2 className="text-xl font-bold mb-3">Erro</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
                    <button
                        onClick={loadTenants}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-semibold"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    if (tenants.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-900 dark:to-primary/10 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-yellow-600">store</span>
                    </div>
                    <h2 className="text-xl font-bold mb-3">Nenhum Estabelecimento</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Você não tem nenhum estabelecimento cadastrado. Crie seu primeiro estabelecimento para começar.
                    </p>
                    <button
                        onClick={() => navigate('/onboarding')}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-semibold"
                    >
                        Criar Estabelecimento
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-900 dark:to-primary/10 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-primary">store</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                        Selecione o Estabelecimento
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300">
                        Escolha qual estabelecimento você deseja acessar
                    </p>
                </div>

                {/* Grouped Tenants */}
                {Object.entries(groupedTenants).map(([category, categoryTenants]) => {
                    const catInfo = CATEGORY_INFO[category] || CATEGORY_INFO.outro;

                    return (
                        <div key={category} className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catInfo.color} flex items-center justify-center`}>
                                    <span className="material-symbols-outlined text-white text-xl">
                                        {catInfo.icon}
                                    </span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                    {catInfo.name}
                                </h2>
                                <span className="text-sm text-slate-400">
                                    ({categoryTenants.length})
                                </span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {categoryTenants.map(tenant => (
                                    <div
                                        key={tenant.tenant_id}
                                        className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start gap-4">
                                                {/* Logo or Placeholder */}
                                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${catInfo.color} flex items-center justify-center flex-shrink-0`}>
                                                    {tenant.logo_url ? (
                                                        <img
                                                            src={tenant.logo_url}
                                                            alt={tenant.nome_salao}
                                                            className="w-full h-full object-cover rounded-xl"
                                                        />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-white text-2xl">
                                                            {catInfo.icon}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-800 dark:text-white truncate">
                                                        {tenant.nome_salao}
                                                    </h3>
                                                    {(tenant.endereco || tenant.cidade) && (
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                            <span className="material-symbols-outlined text-base">location_on</span>
                                                            {[tenant.endereco, tenant.cidade].filter(Boolean).join(', ')}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${tenant.role === 'owner'
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                            }`}>
                                                            {tenant.role === 'owner' ? 'Proprietário' : tenant.role === 'admin' ? 'Admin' : 'Equipe'}
                                                        </span>
                                                        {tenant.is_default && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                                Padrão
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() => handleSelectTenant(tenant)}
                                                disabled={selecting !== null}
                                                className={`w-full mt-4 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${selecting === tenant.tenant_id
                                                        ? 'bg-primary/60 text-white cursor-wait'
                                                        : 'bg-primary hover:bg-primary-dark text-white'
                                                    }`}
                                            >
                                                {selecting === tenant.tenant_id ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Entrando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-xl">login</span>
                                                        Entrar
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Create New Button */}
                <div className="text-center mt-10">
                    <button
                        onClick={() => navigate('/onboarding')}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Criar Novo Estabelecimento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TenantSelectionPage;
