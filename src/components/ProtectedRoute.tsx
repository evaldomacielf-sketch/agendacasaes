import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = () => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Optional: Check if user has a tenant/profile. 
    // If not, they might be in a "Signup completed but not onboarded" state.
    // For now, we allow access but components might handle "no tenant" gracefully or we redirect.
    // if (!profile?.tenant_id) return <Navigate to="/onboarding" replace />;

    return <Outlet />;
};
