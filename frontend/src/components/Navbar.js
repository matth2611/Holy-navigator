import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  BookOpen, 
  Compass, 
  MessageSquare, 
  PenLine, 
  Search, 
  Sun, 
  Moon, 
  Menu,
  X,
  User,
  LogOut,
  Crown,
  Newspaper,
  Home,
  BookMarked,
  Heart,
  Video
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isPremium } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/bible', label: 'Bible', icon: BookOpen },
    { path: '/devotional', label: 'Devotional', icon: Heart },
    { path: '/dictionary', label: 'Dictionary', icon: Search },
    { path: '/news-analysis', label: 'News Analysis', icon: Newspaper, premium: true },
    { path: '/media', label: 'Sermons', icon: Video, premium: true },
    { path: '/forum', label: 'Community', icon: MessageSquare, premium: true },
    { path: '/journal', label: 'Journal', icon: PenLine, premium: true },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className="backdrop-blur-xl bg-background/80 border-b border-border/40 sticky top-0 z-50" data-testid="main-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A2463] to-[#0F172A] flex items-center justify-center">
                <Compass className="w-6 h-6 text-[#C5A059]" />
              </div>
              <span className="font-serif text-xl font-bold hidden sm:block">Prophecy News</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive(link.path)
                      ? 'bg-[#0A2463]/10 text-[#0A2463] dark:bg-[#C5A059]/10 dark:text-[#C5A059]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  data-testid={`nav-${link.path.slice(1)}`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                  {link.premium && !isPremium && (
                    <Crown className="w-3 h-3 text-[#C5A059]" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
                data-testid="theme-toggle"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>

              {isAuthenticated ? (
                <>
                  {!isPremium && (
                    <Link to="/pricing">
                      <Button 
                        size="sm" 
                        className="hidden sm:flex bg-gradient-to-r from-[#C5A059] to-[#E5C57F] text-[#0A2463] hover:opacity-90 rounded-full"
                        data-testid="upgrade-btn"
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        Upgrade
                      </Button>
                    </Link>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full" data-testid="user-menu-trigger">
                        <User className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        {isPremium && (
                          <span className="premium-badge mt-1">
                            <Crown className="w-3 h-3" /> Premium
                          </span>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/bookmarks" className="flex items-center gap-2" data-testid="bookmarks-link">
                          <BookMarked className="w-4 h-4" />
                          My Bookmarks
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-2" data-testid="profile-link">
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-btn">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" data-testid="login-btn">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" className="hidden sm:block">
                    <Button size="sm" className="btn-primary" data-testid="register-btn">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 bg-background animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-[#0A2463]/10 text-[#0A2463] dark:bg-[#C5A059]/10 dark:text-[#C5A059]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  data-testid={`mobile-nav-${link.path.slice(1)}`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                  {link.premium && !isPremium && (
                    <Crown className="w-4 h-4 text-[#C5A059] ml-auto" />
                  )}
                </Link>
              ))}
              
              {!isAuthenticated && (
                <div className="pt-4 flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full btn-primary">Get Started</Button>
                  </Link>
                </div>
              )}
              
              {isAuthenticated && !isPremium && (
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-[#C5A059] to-[#E5C57F] text-[#0A2463] mt-4">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
