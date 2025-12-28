import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import LoadingSpinner from './LoadingSpinner';
import TenantErrorScreen from './TenantErrorScreen';

export const ProtectedRoute = () => {
    const { user, loading: authLoading } = useAuth();
    const { tenantId, loading: tenantLoading, error: tenantError } = useTenant();

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

    // Tenant error - show error screen with helpful message
    if (tenantError && !tenantId) {
        return <TenantErrorScreen error={tenantError} />;
    }

    // All good - render protected content
    return <Outlet />;
};

