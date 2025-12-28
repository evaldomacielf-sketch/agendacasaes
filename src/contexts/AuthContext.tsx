import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import * as Sentry from "@sentry/react";

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

    // Fetch profile with timeout to prevent hanging
    const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (error) {
                console.warn('[AuthContext] Profile fetch error:', error.message);
                return null;
            }
            console.log('[AuthContext] Profile loaded:', data?.id);
            return data as UserProfile;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.warn('[AuthContext] Profile fetch timed out');
            } else {
                console.error('[AuthContext] Unexpected error fetching profile:', error);
            }
            return null;
        }
    };

    useEffect(() => {
        // Guard against infinite loading - force complete after 8 seconds
        const loadingTimeout = setTimeout(() => {
            if (loading) {
                console.warn('[AuthContext] Forced loading complete after timeout');
                setLoading(false);
            }
        }, 8000);

        const initializeAuth = async () => {
            console.log('[AuthContext] Initializing auth...');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[AuthContext] Session:', session ? 'exists' : 'none');

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const userProfile = await fetchProfile(session.user.id);
                    setProfile(userProfile);

                    // Set Sentry user context for error tracking
                    Sentry.setUser({
                        id: session.user.id,
                        email: session.user.email,
                    });
                    if (userProfile?.tenant_id) {
                        Sentry.setTag("tenant_id", userProfile.tenant_id);
                    }
                }
            } catch (error) {
                console.error('[AuthContext] Error during initialization:', error);
            } finally {
                setLoading(false);
                clearTimeout(loadingTimeout);
            }
        };

        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('[AuthContext] Auth state changed:', _event);
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
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
            clearTimeout(loadingTimeout);
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        Sentry.setUser(null); // Clear Sentry user on logout
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
