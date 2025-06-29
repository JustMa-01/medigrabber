/*
  # Add Instagram Profile Support

  1. Updates
    - Ensure profiles table supports Instagram ID storage
    - Update auth trigger to handle Instagram OAuth data
    - Add proper indexes for performance

  2. Security
    - Maintain existing RLS policies
    - Ensure Instagram ID is properly stored and retrieved
*/

-- Ensure the instagram_id column exists and is properly indexed
DO $$
BEGIN
  -- Add index on instagram_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' 
    AND indexname = 'profiles_instagram_id_idx'
  ) THEN
    CREATE INDEX profiles_instagram_id_idx ON public.profiles(instagram_id);
  END IF;
END $$;

-- Update the handle_new_user function to better handle Instagram OAuth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  instagram_id_value TEXT;
BEGIN
  -- Extract username from metadata with fallbacks
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name', 
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'user_' || substring(NEW.id::text, 1, 8)
  );

  -- Extract Instagram ID if this is an Instagram OAuth login
  instagram_id_value := NULL;
  IF NEW.raw_app_meta_data->>'provider' = 'instagram' THEN
    instagram_id_value := COALESCE(
      NEW.raw_user_meta_data->>'provider_id',
      NEW.raw_user_meta_data->>'sub',
      NEW.raw_user_meta_data->>'id'
    );
  END IF;

  -- Insert or update profile
  INSERT INTO public.profiles (id, username, instagram_id, created_at, updated_at)
  VALUES (
    NEW.id,
    username_value,
    instagram_id_value,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, profiles.username),
    instagram_id = COALESCE(EXCLUDED.instagram_id, profiles.instagram_id),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to update Instagram connection
CREATE OR REPLACE FUNCTION update_instagram_connection(user_id UUID, instagram_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    instagram_id = instagram_user_id,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_instagram_connection(UUID, TEXT) TO authenticated;