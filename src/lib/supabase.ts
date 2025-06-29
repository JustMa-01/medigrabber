import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          instagram_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          instagram_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          instagram_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: 'free' | 'pro';
          status: 'active' | 'cancelled' | 'expired';
          current_period_start: string;
          current_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type?: 'free' | 'pro';
          status?: 'active' | 'cancelled' | 'expired';
          current_period_start?: string;
          current_period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: 'free' | 'pro';
          status?: 'active' | 'cancelled' | 'expired';
          current_period_start?: string;
          current_period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      download_records: {
        Row: {
          id: string;
          user_id: string;
          platform: 'YouTube' | 'Instagram';
          url: string;
          media_type: 'video' | 'audio' | 'image' | 'reel' | 'post' | 'story';
          file_path: string | null;
          filename: string | null;
          file_size: number | null;
          status: 'pending' | 'completed' | 'failed';
          error_message: string | null;
          created_at: string;
          subscription_id: string | null;
          quality: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: 'YouTube' | 'Instagram';
          url: string;
          media_type: 'video' | 'audio' | 'image' | 'reel' | 'post' | 'story';
          file_path?: string | null;
          filename?: string | null;
          file_size?: number | null;
          status?: 'pending' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          subscription_id?: string | null;
          quality?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: 'YouTube' | 'Instagram';
          url?: string;
          media_type?: 'video' | 'audio' | 'image' | 'reel' | 'post' | 'story';
          file_path?: string | null;
          filename?: string | null;
          file_size?: number | null;
          status?: 'pending' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          subscription_id?: string | null;
          quality?: string | null;
        };
      };
    };
  };
};