import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = () => {
    const { user, loading: authLoading } = useAuth();
    // We can also check tenant status here if we want to force onboarding
    // For now, we just ensure the provider is ready. The Provider inside App.tsx wraps this,
    // so we can use the hook.
    // However, ProtectedRoute is often used *inside* the layout that provides the context?
    // Actually, usually Providers wrap the Routes.
    // Let's assume App.tsx will wrap everything in TenantProvider.

    // Note: useTenant might throw if not wrapped. We'll ensure App.tsx wraps it.

    if (authLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Optional: We could check tenant loading here too if we wrapped it high enough
    // but typically auth is enough for the route protection, and specific pages check tenant.

    return <Outlet />;
};
