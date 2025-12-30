import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, BookOpen, Heart, MessageSquare, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0A2463] text-white py-16" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Compass className="w-6 h-6 text-[#C5A059]" />
              </div>
              <span className="font-serif text-xl font-bold">Prophecy News Study Bible</span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed">
              Connecting current events to biblical prophecy and eternal truths through scripture and community.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-[#C5A059]">Features</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/bible" className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Bible Reader
                </Link>
              </li>
              <li>
                <Link to="/devotional" className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Daily Devotional
                </Link>
              </li>
              <li>
                <Link to="/news-analysis" className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  News Analysis
                </Link>
              </li>
              <li>
                <Link to="/forum" className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Community Forum
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-[#C5A059]">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dictionary" className="text-white/70 hover:text-white transition-colors text-sm">
                  Bible Dictionary
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-white/70 hover:text-white transition-colors text-sm">
                  Premium Features
                </Link>
              </li>
              <li>
                <a href="#faq" className="text-white/70 hover:text-white transition-colors text-sm">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-[#C5A059]">Contact</h4>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Mail className="w-4 h-4" />
              support@prophecynewsstudybible.com
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Prophecy News Study Bible. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="text-white/50 hover:text-white text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-white/50 hover:text-white text-sm transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
