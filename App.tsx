import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import { AuthProvider } from './contexts/AuthContext';
import { ScreenName } from './types';
import LoadingSpinner from './components/LoadingSpinner';

// Static Imports for Critical Path
import LandingScreen from './screens/LandingScreen';
import FeaturesScreen from './screens/FeaturesScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import TargetAudienceScreen from './screens/TargetAudienceScreen';
import PricingScreen from './screens/PricingScreen';
import FAQScreen from './screens/FAQScreen';
import TestimonialsScreen from './screens/TestimonialsScreen';
import BookingScreen from './screens/BookingScreen';
import DashboardLayout from './components/dashboard/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy Imports for Dashboard Screens (Code Splitting)
const MainFeaturesScreen = React.lazy(() => import('./screens/MainFeaturesScreen'));
const AgendaScreen = React.lazy(() => import('./screens/dashboard/AgendaScreen'));
const FinancialScreen = React.lazy(() => import('./screens/dashboard/FinancialScreen'));
const ClientsScreen = React.lazy(() => import('./screens/dashboard/ClientsScreen'));
const ServicesScreen = React.lazy(() => import('./screens/dashboard/ServicesScreen'));
const ReportsScreen = React.lazy(() => import('./screens/dashboard/ReportsScreen'));
const MarketingScreen = React.lazy(() => import('./screens/dashboard/MarketingScreen'));
const SettingsScreen = React.lazy(() => import('./screens/dashboard/SettingsScreen'));

// Map ScreenName to URL paths
const SCREEN_PATHS: Record<ScreenName, string> = {
  [ScreenName.LANDING]: '/',
  [ScreenName.FEATURES]: '/features',
  [ScreenName.SIGNUP]: '/signup',
  [ScreenName.LOGIN]: '/login',
  [ScreenName.TARGET_AUDIENCE]: '/target-audience',
  [ScreenName.PRICING]: '/pricing',
  [ScreenName.FAQ]: '/faq',
  [ScreenName.TESTIMONIALS]: '/testimonials',
  [ScreenName.BOOKING]: '/booking',
  // Dashboard routes
  [ScreenName.MAIN_FEATURES]: '/dashboard',
  [ScreenName.DASHBOARD]: '/dashboard', // Fallback
  [ScreenName.DASHBOARD_AGENDA]: '/dashboard/agenda',
  [ScreenName.DASHBOARD_CLIENTS]: '/dashboard/clients',
  [ScreenName.DASHBOARD_SERVICES]: '/dashboard/services',
  [ScreenName.DASHBOARD_FINANCIAL]: '/dashboard/financial',
  [ScreenName.DASHBOARD_MARKETING]: '/dashboard/marketing',
  [ScreenName.DASHBOARD_REPORTS]: '/dashboard/reports',
  [ScreenName.DASHBOARD_SETTINGS]: '/dashboard/settings',
};

// Wrapper to provide onNavigate prop to legacy components
const LegacyScreenWrapper: React.FC<{ Component: React.ElementType }> = ({ Component }) => {
  const navigate = useNavigate();

  const onNavigate = (screen: ScreenName) => {
    const path = SCREEN_PATHS[screen];
    if (path) {
      navigate(path);
      window.scrollTo(0, 0);
    } else {
      console.warn(`No path found for screen: ${screen}`);
    }
  };

  return <Component onNavigate={onNavigate} />;
};

const App: React.FC = () => {
  return (
    <Sentry.ErrorBoundary fallback={<div className="flex items-center justify-center h-screen text-red-600">Um erro inesperado ocorreu.</div>}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-text-main">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LegacyScreenWrapper Component={LandingScreen} />} />
                <Route path="/features" element={<LegacyScreenWrapper Component={FeaturesScreen} />} />
                <Route path="/target-audience" element={<LegacyScreenWrapper Component={TargetAudienceScreen} />} />
                <Route path="/pricing" element={<LegacyScreenWrapper Component={PricingScreen} />} />
                <Route path="/faq" element={<LegacyScreenWrapper Component={FAQScreen} />} />
                <Route path="/testimonials" element={<LegacyScreenWrapper Component={TestimonialsScreen} />} />
                <Route path="/booking" element={<LegacyScreenWrapper Component={BookingScreen} />} />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/signup" element={<SignupScreen />} />

                {/* Protected Dashboard Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<LegacyScreenWrapper Component={MainFeaturesScreen} />} />
                    <Route path="agenda" element={<LegacyScreenWrapper Component={AgendaScreen} />} />
                    <Route path="clients" element={<LegacyScreenWrapper Component={ClientsScreen} />} />
                    <Route path="services" element={<LegacyScreenWrapper Component={ServicesScreen} />} />
                    <Route path="financial" element={<LegacyScreenWrapper Component={FinancialScreen} />} />
                    <Route path="marketing" element={<LegacyScreenWrapper Component={MarketingScreen} />} />
                    <Route path="reports" element={<LegacyScreenWrapper Component={ReportsScreen} />} />
                    <Route path="settings" element={<LegacyScreenWrapper Component={SettingsScreen} />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<LegacyScreenWrapper Component={LandingScreen} />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
};

export default App;
