import React, { useState } from 'react';
import { YoutubeDownloader } from '../components/YoutubeDownloader';
import { InstagramDownloader } from '../components/InstagramDownloader';
import { DownloadHistory } from '../components/DownloadHistory';
import { Youtube, Instagram, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ActiveTab = 'youtube' | 'instagram' | 'history';

export function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('youtube');

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          MediaGrabber
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Download YouTube videos & Instagram content with ease
        </p>
        <p className="text-sm text-gray-500">
          Paste any URL below to get started - no account required to preview
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-2 border border-white/20">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'youtube'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <Youtube className="h-5 w-5" />
            YouTube Downloader
          </button>
          <button
            onClick={() => setActiveTab('instagram')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'instagram'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <Instagram className="h-5 w-5" />
            Instagram Downloader
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <History className="h-5 w-5" />
              Download History
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="transition-all duration-500 ease-out">
        {activeTab === 'youtube' && <YoutubeDownloader />}
        {activeTab === 'instagram' && <InstagramDownloader />}
        {activeTab === 'history' && user && <DownloadHistory />}
        {activeTab === 'history' && !user && (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Sign in to view history</h3>
            <p className="text-gray-500">Create an account to track your downloads and access them anytime.</p>
          </div>
        )}
      </div>
    </div>
  );
}