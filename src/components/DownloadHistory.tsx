import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Download, Calendar, FileText, Video, Music, Image, Instagram, Youtube, AlertCircle, Loader } from 'lucide-react';
import type { Database } from '../lib/supabase';

type DownloadRecord = Database['public']['Tables']['download_records']['Row'];

export function DownloadHistory() {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchDownloads();
    }
  }, [user]);

  const fetchDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from('download_records')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDownloads(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'image':
      case 'post':
        return <Image className="h-4 w-4" />;
      case 'reel':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'YouTube' ? 
      <Youtube className="h-4 w-4 text-red-500" /> : 
      <Instagram className="h-4 w-4 text-pink-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleDownloadFile = async (downloadId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // In a real implementation, this would download the file
      // For now, we'll just show a message
      alert('File download would start here. This is a demo implementation.');
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Download failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading download history: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-800">Download History</h2>
      </div>

      {downloads.length === 0 ? (
        <div className="text-center py-12">
          <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No downloads yet</h3>
          <p className="text-gray-500">Start downloading videos and media to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {downloads.map((download) => (
            <div
              key={download.id}
              className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-200 hover:bg-white/70 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(download.platform)}
                  {getMediaIcon(download.media_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800 truncate">
                      {download.filename || 'Processing...'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(download.status)}`}>
                      {download.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{download.platform} • {download.media_type}</span>
                    {download.file_size && (
                      <span>{formatFileSize(download.file_size)}</span>
                    )}
                    <span>{formatDate(download.created_at)}</span>
                  </div>
                  {download.error_message && (
                    <p className="text-sm text-red-600 mt-1">{download.error_message}</p>
                  )}
                </div>
              </div>

              {download.status === 'completed' && download.file_path && (
                <button 
                  onClick={() => handleDownloadFile(download.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}