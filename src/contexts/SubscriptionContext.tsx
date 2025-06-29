import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Database } from '../lib/supabase';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isPro: boolean;
  refreshSubscription: () => Promise<void>;
  upgradeToPro: () => Promise<{ error: any }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      } else {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const upgradeToPro = async () => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      // In a real app, this would integrate with a payment processor
      // For demo purposes, we'll just update the subscription
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: 'pro',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .eq('user_id', user.id);

      if (error) {
        return { error };
      }

      await refreshSubscription();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const isPro = subscription?.plan_type === 'pro' && subscription?.status === 'active';

  const value = {
    subscription,
    loading,
    isPro,
    refreshSubscription,
    upgradeToPro,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}