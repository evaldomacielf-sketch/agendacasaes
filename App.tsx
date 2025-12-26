import React, { useState } from 'react';
import { ScreenName } from './types';
import LandingScreen from './screens/LandingScreen';
import FeaturesScreen from './screens/FeaturesScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import TargetAudienceScreen from './screens/TargetAudienceScreen';
import PricingScreen from './screens/PricingScreen';
import FAQScreen from './screens/FAQScreen';
import TestimonialsScreen from './screens/TestimonialsScreen';
import MainFeaturesScreen from './screens/MainFeaturesScreen';
import BookingScreen from './screens/BookingScreen';
import AgendaScreen from './screens/dashboard/AgendaScreen';
import FinancialScreen from './screens/dashboard/FinancialScreen';
import ClientsScreen from './screens/dashboard/ClientsScreen';
import ServicesScreen from './screens/dashboard/ServicesScreen';
import ReportsScreen from './screens/dashboard/ReportsScreen';

import MarketingScreen from './screens/dashboard/MarketingScreen';
import SettingsScreen from './screens/dashboard/SettingsScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(ScreenName.LANDING);

  const navigate = (screen: ScreenName) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case ScreenName.LANDING:
        return <LandingScreen onNavigate={navigate} />;
      case ScreenName.FEATURES:
        return <FeaturesScreen onNavigate={navigate} />;
      case ScreenName.LOGIN:
        return <LoginScreen onNavigate={navigate} />;
      case ScreenName.SIGNUP:
        return <SignupScreen onNavigate={navigate} />;
      case ScreenName.TARGET_AUDIENCE:
        return <TargetAudienceScreen onNavigate={navigate} />;
      case ScreenName.PRICING:
        return <PricingScreen onNavigate={navigate} />;
      case ScreenName.FAQ:
        return <FAQScreen onNavigate={navigate} />;
      case ScreenName.TESTIMONIALS:
        return <TestimonialsScreen onNavigate={navigate} />;
      case ScreenName.MAIN_FEATURES:
        return <MainFeaturesScreen onNavigate={navigate} />;
      case ScreenName.BOOKING:
        return <BookingScreen onNavigate={navigate} />;

      // Dashboard Routes
      case ScreenName.DASHBOARD_AGENDA:
        return <AgendaScreen onNavigate={navigate} />;
      case ScreenName.DASHBOARD_CLIENTS:
        return <ClientsScreen onNavigate={navigate} />;
      case ScreenName.DASHBOARD_SERVICES:
        return <ServicesScreen onNavigate={navigate} />;
      case ScreenName.DASHBOARD_FINANCIAL:
        return <FinancialScreen onNavigate={navigate} />;
      case ScreenName.DASHBOARD_MARKETING:
        return <MarketingScreen onNavigate={navigate} />;
      case ScreenName.DASHBOARD_REPORTS:
        return <ReportsScreen onNavigate={navigate} />;
      case ScreenName.DASHBOARD_SETTINGS:
        return <SettingsScreen onNavigate={navigate} />;

      default:
        return <LandingScreen onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-text-main">
      {renderScreen()}

      {/* Navigation Dev Tool */}
      <div className="fixed bottom-4 right-4 z-[100] group">
        <button className="bg-primary hover:bg-primary-dark text-white rounded-full p-3 shadow-lg transition-all flex items-center justify-center">
          <span className="material-symbols-outlined">layers</span>
        </button>
        <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 hidden group-hover:block w-48 max-h-[80vh] overflow-y-auto">
          <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Navigate Screens</p>
          {Object.values(ScreenName).map((screen) => (
            <button
              key={screen}
              onClick={() => navigate(screen)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${currentScreen === screen
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {screen.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;