import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Instagram, Mail, Calendar, Crown, Link as LinkIcon, CheckCircle, AlertCircle, Loader, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';

interface UserProfile {
  id: string;
  username: string | null;
  instagram_id: string | null;
  created_at: string;
  updated_at: string;
}

export function Profile() {
  const { user, signInWithInstagram } = useAuth();
  const { subscription, isPro } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setUsername(data.username || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user!.id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const connectInstagram = async () => {
    setConnectingInstagram(true);
    setError('');

    try {
      // First, update the profile to indicate Instagram connection attempt
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user!.id);

      // Initiate Instagram OAuth with special scope for stories
      const { error } = await signInWithInstagram();
      
      if (error) {
        throw error;
      }
      
      // The OAuth flow will handle the rest
    } catch (err: any) {
      setError(err.message);
      setConnectingInstagram(false);
    }
  };

  const disconnectInstagram = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ instagram_id: null })
        .eq('id', user!.id);

      if (error) throw error;

      setSuccess('Instagram account disconnected successfully!');
      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-800">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
              <Crown className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Subscription</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 capitalize">
                    {subscription?.plan_type || 'Free'} Plan
                  </p>
                  {isPro && (
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
                      Pro
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!isPro && (
              <Link
                to="/pricing"
                className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors"
              >
                <Crown className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-700">Upgrade to Pro</p>
                  <p className="text-sm text-purple-600">Unlock 4K downloads and premium features</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                placeholder="Enter your username"
              />
              <button
                onClick={updateProfile}
                disabled={updating || username === profile.username}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {updating && <Loader className="h-4 w-4 animate-spin" />}
                Update
              </button>
            </div>
          </div>

          {(error || success) && (
            <div className={`flex items-center gap-2 p-4 rounded-xl ${
              error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              <span>{error || success}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instagram Connection */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <Instagram className="h-6 w-6 text-pink-600" />
          <h2 className="text-xl font-semibold text-gray-800">Instagram Connection</h2>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Shield className="h-6 w-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Why Connect Instagram?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Download Instagram Stories (requires authentication)</li>
                  <li>• Access private content you have permission to view</li>
                  <li>• Enhanced download reliability for all Instagram content</li>
                  <li>• Your credentials are securely handled by Instagram OAuth</li>
                </ul>
              </div>
            </div>
          </div>

          {profile.instagram_id ? (
            <div className="flex items-center justify-between p-6 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Instagram Connected</h3>
                  <p className="text-sm text-green-600">
                    You can now download Instagram Stories and access enhanced features
                  </p>
                </div>
              </div>
              <button
                onClick={disconnectInstagram}
                disabled={updating}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {updating && <Loader className="h-4 w-4 animate-spin" />}
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-6 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <LinkIcon className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Instagram Not Connected</h3>
                  <p className="text-sm text-gray-600">
                    Connect your Instagram account to download Stories and access premium features
                  </p>
                </div>
              </div>
              <button
                onClick={connectInstagram}
                disabled={connectingInstagram}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-pink-500/25 flex items-center gap-2"
              >
                {connectingInstagram ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Instagram className="h-5 w-5" />
                    Connect Instagram
                  </>
                )}
              </button>
            </div>
          )}

          {/* Story Download Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Instagram Story Downloads</p>
                <p>
                  Due to Instagram's privacy policies, downloading Stories requires you to be signed in 
                  with an Instagram account that has permission to view those Stories. Public posts and 
                  Reels can be downloaded without Instagram authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Account Actions</h2>
        
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-800">Go to Dashboard</p>
              <p className="text-sm text-blue-600">Access your downloads and start new ones</p>
            </div>
          </Link>

          <Link
            to="/pricing"
            className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-purple-800">View Pricing Plans</p>
              <p className="text-sm text-purple-600">Upgrade to unlock premium features</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}