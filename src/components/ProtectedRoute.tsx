import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import LoadingSpinner from './LoadingSpinner';
import TenantErrorScreen from './TenantErrorScreen';

export const ProtectedRoute = () => {
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const { tenantId, loading: tenantLoading, error: tenantError, needsTenantSelection } = useTenant();

    // Still loading auth
    if (authLoading) {
        return <LoadingSpinner />;
    }

    // Not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Loading tenant
    if (tenantLoading) {
        return <LoadingSpinner />;
    }

    // Needs tenant selection - redirect to selection page
    // But don't redirect if already on the selection page
    if (needsTenantSelection && !tenantId && location.pathname !== '/select-tenant') {
        return <Navigate to="/select-tenant" replace />;
    }

    // Tenant error (and not needing selection) - show error screen
    if (tenantError && !tenantId && !needsTenantSelection) {
        return <TenantErrorScreen error={tenantError} />;
    }

    // All good - render protected content
    return <Outlet />;
};


