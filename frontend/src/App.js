import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute, PremiumRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import BiblePage from './pages/BiblePage';
import DevotionalPage from './pages/DevotionalPage';
import DictionaryPage from './pages/DictionaryPage';
import NewsAnalysisPage from './pages/NewsAnalysisPage';
import ForumPage from './pages/ForumPage';
import JournalPage from './pages/JournalPage';
import BookmarksPage from './pages/BookmarksPage';
import PricingPage from './pages/PricingPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import ProfilePage from './pages/ProfilePage';
import ReadingPlanPage from './pages/ReadingPlanPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

import './App.css';

// ScrollToTop component - scrolls to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  
  return null;
};

const AppContent = () => {
  const location = useLocation();
  
  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  const hideNavFooter = ['/login', '/register', '/auth/callback'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {!hideNavFooter && <Navbar />}
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<PricingPage />} />
          
          {/* Free Features */}
          <Route path="/bible" element={<BiblePage />} />
          <Route path="/bible/:book/:chapter" element={<BiblePage />} />
          <Route path="/devotional" element={<DevotionalPage />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/reading-plan" element={<ReadingPlanPage />} />
          
          {/* Protected Routes */}
          <Route path="/bookmarks" element={
            <ProtectedRoute>
              <BookmarksPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Premium Routes */}
          <Route path="/news-analysis" element={<NewsAnalysisPage />} />
          <Route path="/forum" element={
            <PremiumRoute>
              <ForumPage />
            </PremiumRoute>
          } />
          <Route path="/journal" element={
            <PremiumRoute>
              <JournalPage />
            </PremiumRoute>
          } />
          <Route path="/media" element={
            <PremiumRoute>
              <MediaLibraryPage />
            </PremiumRoute>
          } />
          
          {/* Subscription Success */}
          <Route path="/subscription/success" element={<PricingPage />} />
          
          {/* Legal Pages */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
        </Routes>
      </main>
      {!hideNavFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
