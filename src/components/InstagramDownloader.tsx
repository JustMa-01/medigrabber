import React, { useState, useEffect } from 'react';
import { Download, Link as LinkIcon, Image, Video, CheckCircle, AlertCircle, Loader, LogIn, Instagram, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type DownloadStatus = 'idle' | 'validating' | 'downloading' | 'success' | 'error' | 'auth-required';
type MediaType = 'post' | 'reel' | 'story';

interface DownloadResult {
  filename: string;
  size: string;
  download_id: string;
}

export function InstagramDownloader() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('post');
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [detectedType, setDetectedType] = useState<MediaType | null>(null);
  const [hasInstagramConnection, setHasInstagramConnection] = useState(false);

  useEffect(() => {
    if (user) {
      checkInstagramConnection();
    }
  }, [user]);

  const checkInstagramConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('instagram_id')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setHasInstagramConnection(!!data.instagram_id);
    } catch (err) {
      console.error('Error checking Instagram connection:', err);
    }
  };

  const isValidInstagramUrl = (url: string) => {
    const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|stories)\/[A-Za-z0-9_-]+/;
    return instagramRegex.test(url);
  };

  const detectMediaType = (url: string): MediaType | null => {
    if (url.includes('/p/')) return 'post';
    if (url.includes('/reel/')) return 'reel';
    if (url.includes('/stories/')) return 'story';
    return null;
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl) {
      const detected = detectMediaType(newUrl);
      if (detected) {
        setDetectedType(detected);
        setSelectedMediaType(detected);
      }
    } else {
      setDetectedType(null);
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
    
    if (!isValidInstagramUrl(url)) {
      setStatus('error');
      setError('Please enter a valid Instagram post, reel, or story URL');
      return;
    }

    // Check if trying to download story without Instagram connection
    if (selectedMediaType === 'story' && !hasInstagramConnection) {
      setStatus('error');
      setError('Instagram authentication required for story downloads. Please connect your Instagram account in your profile.');
      return;
    }

    setStatus('downloading');

    try {
      console.log('Starting Instagram download:', { url, selectedMediaType });

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }

      // Call the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          media_type: selectedMediaType,
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
          return prev + Math.random() * 12;
        });
      }, 400);

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
    setDetectedType(null);
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
          <Image className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Instagram Downloader</h2>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
          ✓ Always Free
        </div>
      </div>

      <div className="space-y-6">
        {/* Instagram Connection Status */}
        {user && selectedMediaType === 'story' && (
          <div className={`p-4 rounded-xl border ${
            hasInstagramConnection 
              ? 'bg-green-50 border-green-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-3">
              <Instagram className={`h-5 w-5 ${
                hasInstagramConnection ? 'text-green-600' : 'text-orange-600'
              }`} />
              <div className="flex-1">
                <p className={`font-medium ${
                  hasInstagramConnection ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {hasInstagramConnection 
                    ? 'Instagram Connected - Stories Available' 
                    : 'Instagram Connection Required for Stories'
                  }
                </p>
                <p className={`text-sm ${
                  hasInstagramConnection ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {hasInstagramConnection 
                    ? 'You can download Instagram Stories with your connected account'
                    : 'Connect your Instagram account to download Stories'
                  }
                </p>
              </div>
              {!hasInstagramConnection && (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <Settings className="h-4 w-4" />
                  Connect
                </Link>
              )}
            </div>
          </div>
        )}

        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram URL
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white/50"
              disabled={status === 'downloading' || status === 'validating'}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Paste any Instagram post, reel, or story URL to get started
          </p>
        </div>

        {/* Media Type Detection */}
        {detectedType && (
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
            <div className="flex items-center gap-2 text-pink-700">
              {detectedType === 'post' && <Image className="h-4 w-4" />}
              {detectedType === 'reel' && <Video className="h-4 w-4" />}
              {detectedType === 'story' && <Video className="h-4 w-4" />}
              <span className="text-sm font-medium">
                Auto-detected: Instagram {detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}
              </span>
            </div>
          </div>
        )}

        {/* Media Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Media Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedMediaType('post')}
              disabled={status === 'downloading' || status === 'validating'}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedMediaType === 'post'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                  : 'border-gray-200 bg-white/50 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Image className="h-5 w-5" />
                <span className="font-medium text-sm">Posts</span>
                <span className="text-xs opacity-75">Photos & carousels</span>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedMediaType('reel')}
              disabled={status === 'downloading' || status === 'validating'}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedMediaType === 'reel'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                  : 'border-gray-200 bg-white/50 text-gray-600 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Video className="h-5 w-5" />
                <span className="font-medium text-sm">Reels</span>
                <span className="text-xs opacity-75">Short videos</span>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedMediaType('story')}
              disabled={status === 'downloading' || status === 'validating'}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedMediaType === 'story'
                  ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                  : 'border-gray-200 bg-white/50 text-gray-600 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Video className="h-5 w-5" />
                <span className="font-medium text-sm">Stories</span>
                <span className="text-xs opacity-75">
                  {hasInstagramConnection ? 'Available' : 'Login required'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Story Warning */}
        {selectedMediaType === 'story' && !hasInstagramConnection && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Story downloads require Instagram authentication. Please connect your Instagram account in your profile settings.
              </span>
            </div>
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={!url || status === 'downloading' || status === 'validating' || (selectedMediaType === 'story' && !hasInstagramConnection)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-pink-500/25"
        >
          {status === 'validating' && <Loader className="h-5 w-5 animate-spin" />}
          {status === 'downloading' && <Loader className="h-5 w-5 animate-spin" />}
          {(status === 'idle' || status === 'success' || status === 'error' || status === 'auth-required') && <Download className="h-5 w-5" />}
          
          {status === 'validating' && 'Validating URL...'}
          {status === 'downloading' && `Downloading... ${Math.round(progress)}%`}
          {(status === 'idle' || status === 'success' || status === 'error' || status === 'auth-required') && `Download ${selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)}`}
        </button>

        {/* Progress Bar */}
        {status === 'downloading' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
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
              You need to sign in to download Instagram content. Create a free account to get started!
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