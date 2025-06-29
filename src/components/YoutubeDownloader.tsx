import React, { useState } from 'react';
import { Download, Link as LinkIcon, Music, Video, CheckCircle, AlertCircle, Loader, LogIn, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

type DownloadStatus = 'idle' | 'validating' | 'downloading' | 'success' | 'error' | 'auth-required';
type DownloadType = 'video' | 'audio';

interface DownloadResult {
  filename: string;
  size: string;
  download_id: string;
}

export function YoutubeDownloader() {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [url, setUrl] = useState('');
  const [downloadType, setDownloadType] = useState<DownloadType>('video');
  const [quality, setQuality] = useState<string>('1080p');
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const getAvailableQualities = () => {
    if (downloadType === 'video') {
      return isPro 
        ? ['4K', '1440p', '1080p', '720p', '480p']
        : ['1080p', '720p', '480p'];
    } else {
      return isPro 
        ? ['320kbps', '256kbps', '128kbps']
        : ['128kbps'];
    }
  };

  const handleDownload = async () => {
    // Check if user is authenticated
    if (!user) {
      setStatus('auth-required');
      return;
    }

    setStatus('validating');
    setError('');
    setProgress(0);
    
    if (!isValidYouTubeUrl(url)) {
      setStatus('error');
      setError('Please enter a valid YouTube URL');
      return;
    }

    // Check if user is trying to use pro features without pro subscription
    if (!isPro && ((downloadType === 'video' && ['4K', '1440p'].includes(quality)) || 
                   (downloadType === 'audio' && ['320kbps', '256kbps'].includes(quality)))) {
      setStatus('error');
      setError('This quality requires a Pro subscription. Please upgrade or select a lower quality.');
      return;
    }

    setStatus('downloading');

    try {
      console.log('Starting YouTube download:', { url, downloadType, quality });

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }

      // Call the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          media_type: downloadType,
          quality: quality,
        }),
      });

      const data = await response.json();
      console.log('Download response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      // Wait a bit for the "download" to complete
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        setStatus('success');
        setResult({
          filename: data.filename,
          size: (data.file_size / 1024 / 1024).toFixed(1) + ' MB',
          download_id: data.download_id,
        });
      }, 2000);

    } catch (err: any) {
      console.error('Download error:', err);
      setStatus('error');
      setError(err.message);
    }
  };

  const resetDownload = () => {
    setStatus('idle');
    setResult(null);
    setError('');
    setProgress(0);
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
          <Video className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">YouTube Downloader</h2>
        {!isPro && (
          <Link
            to="/pricing"
            className="ml-auto flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
          >
            <Crown className="h-3 w-3" />
            Upgrade for 4K
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube URL
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/50"
              disabled={status === 'downloading' || status === 'validating'}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Paste any YouTube video URL to get started
          </p>
        </div>

        {/* Download Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Download Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setDownloadType('video');
                setQuality(isPro ? '1440p' : '1080p');
              }}
              disabled={status === 'downloading' || status === 'validating'}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                downloadType === 'video'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white/50 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Video className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Video (MP4)</div>
                <div className="text-xs opacity-75">
                  {isPro ? 'Up to 4K quality' : 'Up to 1080p quality'}
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setDownloadType('audio');
                setQuality(isPro ? '320kbps' : '128kbps');
              }}
              disabled={status === 'downloading' || status === 'validating'}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                downloadType === 'audio'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white/50 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Music className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Audio (MP3)</div>
                <div className="text-xs opacity-75">
                  {isPro ? 'Premium quality' : 'Standard quality'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Quality Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quality
          </label>
          <div className="grid grid-cols-3 gap-2">
            {getAvailableQualities().map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                disabled={status === 'downloading' || status === 'validating'}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  quality === q
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white/50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{q}</div>
              </button>
            ))}
          </div>
          {!isPro && (
            <p className="text-xs text-gray-500 mt-2">
              <Link to="/pricing" className="text-purple-600 hover:text-purple-700">
                Upgrade to Pro
              </Link> for 4K video and 320kbps audio quality
            </p>
          )}
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={!url || status === 'downloading' || status === 'validating'}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-red-500/25"
        >
          {status === 'validating' && <Loader className="h-5 w-5 animate-spin" />}
          {status === 'downloading' && <Loader className="h-5 w-5 animate-spin" />}
          {(status === 'idle' || status === 'success' || status === 'error' || status === 'auth-required') && <Download className="h-5 w-5" />}
          
          {status === 'validating' && 'Validating URL...'}
          {status === 'downloading' && `Downloading... ${Math.round(progress)}%`}
          {(status === 'idle' || status === 'success' || status === 'error' || status === 'auth-required') && `Download ${downloadType === 'video' ? 'Video' : 'Audio'}`}
        </button>

        {/* Progress Bar */}
        {status === 'downloading' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Status Messages */}
        {status === 'auth-required' && (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <LogIn className="h-5 w-5" />
              <span className="font-medium">Sign in required</span>
            </div>
            <p className="text-blue-600 mb-4">
              You need to sign in to download videos. Create a free account to get started!
            </p>
            <div className="flex gap-3">
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {status === 'success' && result && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-4 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Download Complete!</span>
            </div>
            <div className="space-y-2 text-sm text-green-600 mb-4">
              <div>Filename: {result.filename}</div>
              <div>Size: {result.size}</div>
              <div>Quality: {quality}</div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4" />
                Download File
              </button>
              <button
                onClick={resetDownload}
                className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                Download Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}