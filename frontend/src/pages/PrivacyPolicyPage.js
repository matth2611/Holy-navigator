import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-[#C5A059]" />
          <h1 className="font-serif text-4xl font-bold">Privacy Policy</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-foreground/80 mb-4">
              Welcome to Prophecy News Study Bible ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="font-semibold text-lg mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Email address (for account creation)</li>
              <li>Name (optional, for personalization)</li>
              <li>Password (encrypted and securely stored)</li>
            </ul>
            
            <h3 className="font-semibold text-lg mb-2">Usage Information</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Bible reading history and bookmarks</li>
              <li>Journal entries you create</li>
              <li>Forum posts and comments</li>
              <li>News articles you analyze</li>
              <li>Reading plan progress</li>
            </ul>

            <h3 className="font-semibold text-lg mb-2">Payment Information</h3>
            <p className="text-foreground/80 mb-4">
              Payment processing is handled securely by Stripe. We do not store your credit card information on our servers. Please refer to Stripe's privacy policy for more information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>To provide and maintain our service</li>
              <li>To personalize your experience</li>
              <li>To process your subscription payments</li>
              <li>To send you notifications (if enabled)</li>
              <li>To improve our application</li>
              <li>To respond to your inquiries and support requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <p className="text-foreground/80 mb-4">We use the following third-party services:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li><strong>Stripe</strong> - For secure payment processing</li>
              <li><strong>Google OAuth</strong> - For optional social login</li>
              <li><strong>OpenAI</strong> - For AI-powered scripture analysis</li>
              <li><strong>Bible-API.com</strong> - For Bible text content</li>
              <li><strong>Google News</strong> - For daily news content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-foreground/80 mb-4">
              We implement appropriate security measures to protect your personal information. All data is transmitted using SSL encryption, and passwords are hashed before storage. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-foreground/80 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">7. Children's Privacy</h2>
            <p className="text-foreground/80 mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
            <p className="text-foreground/80 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="text-foreground/80 mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-foreground/80">
              Email: <a href="mailto:support@prophecynewsstudybible.com" className="text-[#C5A059] hover:underline">support@prophecynewsstudybible.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
