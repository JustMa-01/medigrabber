import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('loading');
        setMessage('Processing authentication...');

        // Check if we have hash parameters (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error);
          setTimeout(() => {
            navigate('/login?error=' + encodeURIComponent(errorDescription || error));
          }, 3000);
          return;
        }

        if (accessToken) {
          setMessage('Verifying session...');
          
          // Wait a moment for Supabase to process the session
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setStatus('error');
            setMessage('Failed to establish session');
            setTimeout(() => {
              navigate('/login?error=' + encodeURIComponent(sessionError.message));
            }, 3000);
            return;
          }

          if (data.session && data.session.user) {
            setStatus('success');
            setMessage('Sign in successful! Redirecting...');
            
            // Ensure user profile exists
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', data.session.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // Profile doesn't exist, create it
              const username = data.session.user.user_metadata?.name || 
                              data.session.user.user_metadata?.username || 
                              data.session.user.email?.split('@')[0] || 
                              'user';

              await supabase
                .from('profiles')
                .insert({
                  id: data.session.user.id,
                  username: username,
                });
            }

            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            setStatus('error');
            setMessage('No valid session found');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        } else {
          // No access token, check if we have a session anyway
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (data.session) {
            setStatus('success');
            setMessage('Already signed in! Redirecting...');
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            setStatus('error');
            setMessage('No authentication data found');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('Authentication failed');
        setTimeout(() => {
          navigate('/login?error=' + encodeURIComponent('Authentication failed'));
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl text-center max-w-md w-full mx-4">
        <div className="mb-6">
          {status === 'loading' && (
            <Loader className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
          )}
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {status === 'loading' && 'Signing you in...'}
          {status === 'success' && 'Welcome!'}
          {status === 'error' && 'Oops!'}
        </h2>
        
        <p className="text-gray-600 mb-4">{message}</p>
        
        {status === 'error' && (
          <p className="text-sm text-gray-500">
            You'll be redirected to the login page shortly.
          </p>
        )}
      </div>
    </div>
  );
}