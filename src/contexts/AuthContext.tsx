import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

interface UserProfile {
    id: string;
    full_name: string;
    role: 'owner' | 'admin' | 'staff';
    tenant_id: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }
            return data as UserProfile;
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
            return null;
        }
    };

    useEffect(() => {
        // 1. Verificar sessão ativa ao carregar o app
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const userProfile = await fetchProfile(session.user.id);
                setProfile(userProfile);
            }

            setLoading(false);
        };

        initializeAuth();

        // 2. Ouvir mudanças no estado de autenticação (Login, Logout, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // Fetch profile on login if not already loaded
                // Simple check: if we just logged in and profile is null or id mismatch
                if (!profile || profile.id !== session.user.id) {
                    const userProfile = await fetchProfile(session.user.id);
                    setProfile(userProfile);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []); // Removed 'profile' dependency to avoid loops, logic handled inside effect

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar o contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};
