import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  BookOpen, 
  Newspaper, 
  MessageSquare, 
  PenLine, 
  Search, 
  Heart,
  Crown,
  ArrowRight,
  Check,
  Compass
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Complete Bible',
      description: 'Read the entire Bible with easy navigation, bookmarking, and verse highlighting.',
      free: true
    },
    {
      icon: Heart,
      title: 'Daily Devotionals',
      description: 'Start each day with inspiring scripture readings and reflections.',
      free: true
    },
    {
      icon: Search,
      title: 'Bible Dictionary',
      description: 'Explore word definitions, Hebrew/Greek origins, and cross-references.',
      free: true
    },
    {
      icon: Newspaper,
      title: 'News-Scripture Analysis',
      description: 'AI-powered analysis connecting current events to biblical scripture.',
      free: false
    },
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Engage with fellow believers in scripture discussions and fellowship.',
      free: false
    },
    {
      icon: PenLine,
      title: 'Personal Journal',
      description: 'Document your spiritual journey with scripture-linked journal entries.',
      free: false
    },
  ];

  return (
    <div className="min-h-screen" data-testid="landing-page">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-24 md:py-32 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C5A059' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm mb-6 animate-fade-in">
              <Compass className="w-4 h-4 text-[#C5A059]" />
              <span>Navigate Scripture with Purpose</span>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up">
              Connect Current Events to{' '}
              <span className="gold-gradient">Eternal Truth</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Discover how today's headlines align with biblical scripture. Read, study, and journal through the Word with a community of believers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-[#C5A059] hover:bg-[#B49048] text-[#0A2463] rounded-full px-8 py-6 font-semibold text-lg shadow-lg shadow-black/20"
                  data-testid="hero-cta-btn"
                >
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/bible">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg"
                  data-testid="hero-secondary-btn"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Read the Bible
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-6 md:px-12 bg-background" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-sans font-medium tracking-widest uppercase text-[#C5A059] mb-4 block">
              Features
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Spiritual Growth
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From daily devotionals to AI-powered scripture connections, we provide tools for deeper faith.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-card border border-border/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#0A2463]/10 dark:bg-[#C5A059]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-[#0A2463] dark:text-[#C5A059]" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-serif text-xl font-semibold">{feature.title}</h3>
                  {!feature.free && (
                    <span className="premium-badge">
                      <Crown className="w-3 h-3" /> Premium
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Devotional Preview */}
      <section className="py-20 md:py-32 px-6 md:px-12 bg-muted/30" data-testid="devotional-preview">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-sans font-medium tracking-widest uppercase text-[#C5A059] mb-4 block">
                Daily Devotional
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                Start Each Day with God's Word
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Our daily devotionals offer scripture, reflection, and prayer to guide your spiritual journey. Each morning brings new insights and encouragement.
              </p>
              <Link to="/devotional">
                <Button className="btn-primary" data-testid="devotional-cta">
                  Read Today's Devotional
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1741249075351-c09637c89bf7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxwZXJzb24lMjByZWFkaW5nJTIwYmlibGUlMjBtb3JuaW5nJTIwbGlnaHR8ZW58MHx8fHwxNzY3MTE1ODYzfDA&ixlib=rb-4.1.0&q=85"
                alt="Person reading in morning light"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-xl border border-border/40 max-w-xs">
                <p className="font-serif text-lg italic mb-2">
                  "Trust in the LORD with all your heart..."
                </p>
                <p className="text-sm text-muted-foreground">— Proverbs 3:5</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-32 px-6 md:px-12 bg-background" id="pricing" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-sans font-medium tracking-widest uppercase text-[#C5A059] mb-4 block">
              Pricing
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Choose Your Path
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade when you're ready for more features.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-card border border-border/40 rounded-2xl p-8" data-testid="free-plan-card">
              <h3 className="font-serif text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6">Perfect for getting started</p>
              <div className="text-4xl font-bold mb-6">
                $0<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Complete Bible access', 'Daily devotionals', 'Bible dictionary', 'Bookmarking'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button variant="outline" className="w-full rounded-full" data-testid="free-plan-btn">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-[#0A2463] to-[#0F172A] text-white rounded-2xl p-8 relative overflow-hidden" data-testid="premium-plan-card">
              <div className="absolute top-4 right-4">
                <span className="premium-badge">
                  <Crown className="w-3 h-3" /> Popular
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
                  'Ad-free experience'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#C5A059]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="w-full bg-[#C5A059] hover:bg-[#B49048] text-[#0A2463] rounded-full" data-testid="premium-plan-btn">
                  Start Premium Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-6 md:px-12 bg-[#0A2463] text-white" data-testid="cta-section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
            Begin Your Spiritual Journey Today
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of believers who are deepening their faith through scripture study and community.
          </p>
          <Link to="/register">
            <Button 
              size="lg" 
              className="bg-[#C5A059] hover:bg-[#B49048] text-[#0A2463] rounded-full px-10 py-6 text-lg font-semibold"
              data-testid="final-cta-btn"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
