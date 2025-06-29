import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DownloadRequest {
  url: string;
  media_type: 'video' | 'audio';
  quality?: string;
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

    const { url, media_type, quality = 'standard' }: DownloadRequest = await req.json();

    console.log('Download request:', { url, media_type, quality, user_id: user.id });

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's subscription to check quality limits
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const isPro = subscription?.plan_type === 'pro';

    // Check quality restrictions for free users
    if (!isPro) {
      if (media_type === 'video' && ['4K', '1440p'].includes(quality)) {
        return new Response(
          JSON.stringify({ error: 'This quality requires a Pro subscription' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (media_type === 'audio' && ['320kbps', '256kbps'].includes(quality)) {
        return new Response(
          JSON.stringify({ error: 'High quality audio requires a Pro subscription' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create download record
    const { data: downloadRecord, error: insertError } = await supabaseClient
      .from('download_records')
      .insert({
        user_id: user.id,
        platform: 'YouTube',
        url: url,
        media_type: media_type,
        quality: quality,
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

    console.log('Download record created:', downloadRecord.id);

    // In a real implementation, you would:
    // 1. Use yt-dlp to download the video/audio
    // 2. Save it to a storage bucket
    // 3. Update the download record with file info
    
    // For demo purposes, simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate successful download with realistic file sizes
    let filename: string;
    let fileSize: number;

    if (media_type === 'video') {
      filename = `youtube_video_${quality.toLowerCase()}.mp4`;
      // Simulate different file sizes based on quality
      switch (quality) {
        case '4K':
          fileSize = 120000000; // ~120MB
          break;
        case '1440p':
          fileSize = 80000000; // ~80MB
          break;
        case '1080p':
          fileSize = 45000000; // ~45MB
          break;
        case '720p':
          fileSize = 25000000; // ~25MB
          break;
        default:
          fileSize = 15000000; // ~15MB for 480p
      }
    } else {
      filename = `youtube_audio_${quality}.mp3`;
      // Simulate different file sizes based on audio quality
      switch (quality) {
        case '320kbps':
          fileSize = 8000000; // ~8MB
          break;
        case '256kbps':
          fileSize = 6500000; // ~6.5MB
          break;
        default:
          fileSize = 4000000; // ~4MB for 128kbps
      }
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

    console.log('Download completed successfully');

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