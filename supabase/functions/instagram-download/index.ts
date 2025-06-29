import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DownloadRequest {
  url: string;
  media_type: 'post' | 'reel' | 'story';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, media_type }: DownloadRequest = await req.json();

    console.log('Instagram download request:', { url, media_type, user_id: user.id });

    // Validate Instagram URL
    const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|stories)\/[A-Za-z0-9_-]+/;
    if (!instagramRegex.test(url)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Instagram URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is trying to download stories without Instagram auth
    if (media_type === 'story') {
      // Check if user has Instagram ID (OAuth connected)
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('instagram_id')
        .eq('id', user.id)
        .single();

      if (!profile?.instagram_id) {
        return new Response(
          JSON.stringify({ error: 'Instagram authentication required for story downloads. Please sign in with Instagram.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create download record
    const { data: downloadRecord, error: insertError } = await supabaseClient
      .from('download_records')
      .insert({
        user_id: user.id,
        platform: 'Instagram',
        url: url,
        media_type: media_type,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create download record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Instagram download record created:', downloadRecord.id);

    // In a real implementation, you would:
    // 1. Use instaloader or similar to download the media
    // 2. Save it to a storage bucket
    // 3. Update the download record with file info
    
    // For demo purposes, simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate successful download with realistic file sizes
    let filename: string;
    let fileSize: number;

    switch (media_type) {
      case 'reel':
        filename = 'instagram_reel.mp4';
        fileSize = 15000000; // ~15MB
        break;
      case 'story':
        filename = 'instagram_story.mp4';
        fileSize = 8000000; // ~8MB
        break;
      default: // post
        filename = 'instagram_post.jpg';
        fileSize = 2500000; // ~2.5MB
        break;
    }
    
    const { error: updateError } = await supabaseClient
      .from('download_records')
      .update({
        status: 'completed',
        filename: filename,
        file_size: fileSize,
        file_path: `/downloads/${downloadRecord.id}/${filename}`
      })
      .eq('id', downloadRecord.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update download record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Instagram download completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        download_id: downloadRecord.id,
        filename: filename,
        file_size: fileSize,
        message: 'Download completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});