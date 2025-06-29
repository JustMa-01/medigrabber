import React, { useState } from 'react';
import { Check, Crown, Download, Zap, Shield, Star, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link, useNavigate } from 'react-router-dom';

export function Pricing() {
  const { user } = useAuth();
  const { subscription, isPro, upgradeToPro } = useSubscription();
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setUpgrading(true);
    const { error } = await upgradeToPro();
    
    if (error) {
      console.error('Upgrade failed:', error);
      // In a real app, show error message
    } else {
      // Success - redirect to dashboard
      navigate('/dashboard');
    }
    
    setUpgrading(false);
  };

  const freeFeatures = [
    'YouTube videos up to 1080p quality',
    'YouTube audio (medium quality)',
    'Instagram posts, reels & stories',
    'Basic download history',
    'No watermarks',
  ];

  const proFeatures = [
    'YouTube videos in highest available quality (4K, 8K)',
    'YouTube audio in premium quality (320kbps)',
    'Instagram posts, reels & stories',
    'Advanced download history with search',
    'Priority download speeds',
    'Batch downloads',
    'No ads',
    'Premium support',
  ];

  return (
    <div className="max-w-6xl mx-auto py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Start free, upgrade when you need more power
        </p>
        <p className="text-gray-500">
          All plans include unlimited downloads with no hidden fees
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4">
              <Download className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Free</h3>
            <div className="text-4xl font-bold text-gray-800 mb-2">₹0</div>
            <p className="text-gray-600">Perfect for casual users</p>
          </div>

          <ul className="space-y-4 mb-8">
            {freeFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            disabled={true}
            className="w-full py-3 px-6 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed"
          >
            {user && !isPro ? 'Current Plan' : 'Always Free'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border-2 border-gradient-to-r from-purple-500 to-pink-500 relative overflow-hidden">
          {/* Popular Badge */}
          <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-sm font-medium rounded-bl-xl">
            Most Popular
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Pro</h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-800">₹149</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-gray-600">For power users and creators</p>
          </div>

          <ul className="space-y-4 mb-8">
            {proFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {isPro ? (
            <button
              disabled={true}
              className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Star className="h-5 w-5" />
              Current Plan
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              {upgrading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  {user ? 'Upgrade to Pro' : 'Sign Up for Pro'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="mt-16 bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Feature Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-medium text-gray-700">Feature</th>
                <th className="text-center py-4 px-4 font-medium text-gray-700">Free</th>
                <th className="text-center py-4 px-4 font-medium text-gray-700">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 px-4 text-gray-700">YouTube Video Quality</td>
                <td className="py-4 px-4 text-center">Up to 1080p</td>
                <td className="py-4 px-4 text-center">Up to 8K</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">YouTube Audio Quality</td>
                <td className="py-4 px-4 text-center">128kbps</td>
                <td className="py-4 px-4 text-center">320kbps</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">Instagram Downloads</td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">Download History</td>
                <td className="py-4 px-4 text-center">Basic</td>
                <td className="py-4 px-4 text-center">Advanced + Search</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">Batch Downloads</td>
                <td className="py-4 px-4 text-center">-</td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">Priority Support</td>
                <td className="py-4 px-4 text-center">-</td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-8">Frequently Asked Questions</h3>
        
        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h4 className="font-semibold text-gray-800 mb-2">Can I cancel anytime?</h4>
            <p className="text-gray-600">Yes, you can cancel your Pro subscription at any time. You'll continue to have Pro access until the end of your billing period.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h4 className="font-semibold text-gray-800 mb-2">Is there a free trial?</h4>
            <p className="text-gray-600">Our Free plan is permanent and includes core features. You can upgrade to Pro anytime to unlock premium features.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h4 className="font-semibold text-gray-800 mb-2">What payment methods do you accept?</h4>
            <p className="text-gray-600">We accept all major credit cards, debit cards, and UPI payments for Indian users.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h4 className="font-semibold text-gray-800 mb-2">Is my data secure?</h4>
            <p className="text-gray-600">Yes, we use industry-standard encryption and never store your downloaded content permanently on our servers.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to get started?</h3>
          <p className="text-gray-600 mb-6">Join thousands of users who trust MediaGrabber for their download needs.</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
            >
              Start Free
            </Link>
            <Link
              to="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}