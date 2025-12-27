import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import { AuthProvider } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorFallback from './components/common/ErrorFallback';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import DashboardLayout from './components/dashboard/DashboardLayout';

// Pages - Critical Path
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Pages - Lazy Loaded (Code Splitting)
const FeaturesPage = React.lazy(() => import('./pages/FeaturesPage'));
const TargetAudiencePage = React.lazy(() => import('./pages/TargetAudiencePage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const FAQPage = React.lazy(() => import('./pages/FAQPage'));
const TestimonialsPage = React.lazy(() => import('./pages/TestimonialsPage'));
const BookingPage = React.lazy(() => import('./pages/BookingPage'));

// Dashboard Pages - Lazy Loaded
const OverviewPage = React.lazy(() => import('./pages/dashboard/OverviewPage'));
const AgendaPage = React.lazy(() => import('./pages/dashboard/AgendaPage'));
const FinancialPage = React.lazy(() => import('./pages/dashboard/FinancialPage'));
const ClientsPage = React.lazy(() => import('./pages/dashboard/ClientsPage'));
const ServicesPage = React.lazy(() => import('./pages/dashboard/ServicesPage'));
const ReportsPage = React.lazy(() => import('./pages/dashboard/ReportsPage'));
const MarketingPage = React.lazy(() => import('./pages/dashboard/MarketingPage'));
const SettingsPage = React.lazy(() => import('./pages/dashboard/SettingsPage'));

const App: React.FC = () => {
  return (
    <Sentry.ErrorBoundary fallback={({ error, resetErrorBoundary }) => <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-text-main">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/target-audience" element={<TargetAudiencePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/testimonials" element={<TestimonialsPage />} />
                <Route path="/booking" element={<BookingPage />} />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected Dashboard Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<OverviewPage />} />
                    <Route path="agenda" element={<AgendaPage />} />
                    <Route path="clients" element={<ClientsPage />} />
                    <Route path="services" element={<ServicesPage />} />
                    <Route path="financial" element={<FinancialPage />} />
                    <Route path="marketing" element={<MarketingPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
};

export default App;
