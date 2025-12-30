import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Crown, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A2463] dark:border-[#C5A059]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const PremiumRoute = ({ children }) => {
  const { isAuthenticated, isPremium, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A2463] dark:border-[#C5A059]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#C5A059] to-[#E5C57F] flex items-center justify-center">
            <Lock className="w-10 h-10 text-[#0A2463]" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-4">Premium Feature</h2>
          <p className="text-muted-foreground mb-8">
            This feature requires a premium subscription. Upgrade now to unlock all premium features including News-Scripture Analysis, Journaling, and Community Forum access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button className="bg-gradient-to-r from-[#C5A059] to-[#E5C57F] text-[#0A2463] hover:opacity-90 rounded-full px-8">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="rounded-full px-8">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
