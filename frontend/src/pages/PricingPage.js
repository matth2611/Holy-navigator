import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Crown, Check, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const PricingPage = () => {
  const { isAuthenticated, isPremium, getAuthHeaders, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.error('Payment verification timed out. Please check your email for confirmation.');
      return;
    }

    setCheckingStatus(true);

    try {
      const response = await axios.get(`${API_URL}/subscription/status/${sessionId}`, {
        headers: getAuthHeaders()
      });

      if (response.data.payment_status === 'paid') {
        updateUser({ is_premium: true });
        toast.success('Welcome to Premium! 🎉');
        navigate('/bible');
        return;
      } else if (response.data.status === 'expired') {
        toast.error('Payment session expired. Please try again.');
        setCheckingStatus(false);
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/subscription/create-checkout`, {
        origin_url: window.location.origin
      }, {
        headers: getAuthHeaders()
      });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C5A059] mx-auto mb-4"></div>
          <p className="text-lg font-medium">Verifying your payment...</p>
          <p className="text-muted-foreground mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6" data-testid="pricing-page">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#E5C57F] text-[#0A2463] text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            <span>Premium Membership</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Upgrade Your Spiritual Journey
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Unlock powerful features to deepen your faith and connect with a community of believers.
          </p>
        </div>

        {isPremium ? (
          <div className="max-w-md mx-auto bg-gradient-to-br from-[#0A2463] to-[#0F172A] text-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C5A059] flex items-center justify-center">
              <Crown className="w-8 h-8 text-[#0A2463]" />
            </div>
            <h2 className="font-serif text-2xl font-bold mb-2">You're a Premium Member!</h2>
            <p className="text-white/80 mb-6">
              Thank you for your support. Enjoy all premium features.
            </p>
            <Link to="/bible">
              <Button className="bg-[#C5A059] hover:bg-[#B49048] text-[#0A2463] rounded-full">
                Continue Reading
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-card border border-border/40 rounded-2xl p-8" data-testid="free-plan">
              <h3 className="font-serif text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6">Perfect for getting started</p>
              <div className="text-4xl font-bold mb-6">
                $0<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Complete Bible access',
                  'Daily devotionals',
                  'Bible dictionary',
                  'Bookmarking',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
                {[
                  'News-Scripture AI analysis',
                  'Community forum access',
                  'Personal journal',
                  'Ad-free experience',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                    <div className="w-4 h-4 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button variant="outline" className="w-full rounded-full" data-testid="free-signup-btn">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-[#0A2463] to-[#0F172A] text-white rounded-2xl p-8 relative overflow-hidden" data-testid="premium-plan">
              <div className="absolute top-4 right-4">
                <span className="premium-badge">
                  <Crown className="w-3 h-3" /> Best Value
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold mb-2">Premium</h3>
              <p className="text-white/70 mb-6">Full access to all features</p>
              <div className="text-4xl font-bold mb-6">
                $9.99<span className="text-lg font-normal text-white/70">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Free',
                  'News-Scripture AI analysis',
                  'Community forum access',
                  'Personal journal',
                  'Ad-free experience',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-[#C5A059] hover:bg-[#B49048] text-[#0A2463] rounded-full"
                data-testid="subscribe-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </>
                )}
              </Button>
              <p className="text-xs text-white/50 text-center mt-4">
                Cancel anytime. Secure payment via Stripe.
              </p>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="mt-20">
          <h2 className="font-serif text-2xl font-bold text-center mb-12">
            Premium Features in Detail
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI News Analysis',
                description: 'Connect current events to biblical wisdom with our powerful AI that finds relevant scripture for any news story.',
              },
              {
                title: 'Community Forum',
                description: 'Join discussions with fellow believers, share insights, ask questions, and grow together in faith.',
              },
              {
                title: 'Personal Journal',
                description: 'Document your spiritual journey with scripture-linked journal entries and mood tracking.',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-card border border-border/40 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 flex items-center justify-center mb-4">
                  <Crown className="w-6 h-6 text-[#C5A059]" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
