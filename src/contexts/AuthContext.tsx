import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithInstagram: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle successful sign in
      if (event === 'SIGNED_IN' && session) {
        try {
          // Check if user profile exists, create if not
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, instagram_id')
            .eq('id', session.user.id)
            .single();

          if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const username = session.user.user_metadata?.name || 
                            session.user.user_metadata?.username || 
                            session.user.user_metadata?.full_name ||
                            session.user.email?.split('@')[0] || 
                            'user';

            console.log('Creating profile for user:', session.user.id, 'with username:', username);

            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username: username,
              });

            if (insertError) {
              console.error('Error creating profile:', insertError);
            } else {
              console.log('Profile created successfully');
            }
          } else if (profile && session.user.app_metadata?.provider === 'instagram') {
            // Update Instagram ID if signing in with Instagram
            const instagramId = session.user.user_metadata?.provider_id || 
                              session.user.user_metadata?.sub ||
                              session.user.user_metadata?.id;
            
            if (instagramId && !profile.instagram_id) {
              console.log('Updating Instagram ID for user:', session.user.id);
              
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ instagram_id: instagramId })
                .eq('id', session.user.id);

              if (updateError) {
                console.error('Error updating Instagram ID:', updateError);
              } else {
                console.log('Instagram ID updated successfully');
              }
            }
          }
        } catch (err) {
          console.error('Error handling user profile:', err);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithInstagram = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'instagram',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'user_profile,user_media',
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithInstagram,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}