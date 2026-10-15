/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RoomProvider, useRoom } from './context/RoomContext';
import { Navigation, ActiveTab } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { WatchRoomView } from './views/WatchRoomView';
import { DiscoverView } from './views/DiscoverView';
import { PlaylistsView } from './views/PlaylistsView';
import { ProfileSettingsView } from './views/ProfileSettingsView';
import { CreateRoomModal } from './components/CreateRoomModal';
import { MultiClientSimulatorModal } from './components/MultiClientSimulatorModal';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { FirewallSecurityModal } from './components/FirewallSecurityModal';
import { MediaItem } from './types/watchParty';
import { AlertCircle, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    room, 
    joinRoom, 
    errorMessage, 
    clearError, 
    sendPlaybackCommand, 
    sendPlaylistAction, 
    canControlPlayback 
  } = useRoom();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isFirewallOpen, setIsFirewallOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MediaItem | null>(null);

  // Check URL params for room invite on initial load (e.g. ?room=CINEMA-1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      const cleanCode = roomFromUrl.trim().toUpperCase();
      joinRoom(cleanCode);
      setActiveTab('watch-room');
    }
  }, [joinRoom]);

  // Handle switching into watch room after room is created
  const handleRoomCreated = (roomId: string) => {
    setActiveTab('watch-room');
  };

  // Movie actions from Discover / Modal
  const handleWatchNow = (movie: MediaItem) => {
    setSelectedMovie(null);
    if (room) {
      if (canControlPlayback) {
        sendPlaybackCommand('change-media', { media: movie, position: 0 });
      } else {
        sendPlaylistAction('add', { item: movie });
      }
      setActiveTab('watch-room');
    } else {
      // Auto join demo room with this movie or prompt creation
      joinRoom('CINEMA-1');
      setTimeout(() => {
        sendPlaybackCommand('change-media', { media: movie, position: 0 });
      }, 800);
      setActiveTab('watch-room');
    }
  };

  const handleAddToQueue = (movie: MediaItem) => {
    setSelectedMovie(null);
    if (room) {
      sendPlaylistAction('add', { item: movie });
      setActiveTab('watch-room');
    } else {
      joinRoom('CINEMA-1');
      setTimeout(() => {
        sendPlaylistAction('add', { item: movie });
      }, 800);
      setActiveTab('watch-room');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-[#20382B] flex flex-col lg:flex-row font-sans">
      {/* Navigation Sidebar & Mobile Header */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreateRoomClick={() => setIsCreateModalOpen(true)}
        onSimulatorClick={() => setIsSimulatorOpen(true)}
        onFirewallClick={() => setIsFirewallOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Error Toast Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs text-rose-700 z-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={clearError}
              className="p-1 hover:bg-rose-100 rounded text-rose-500 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToRoom={(roomId) => {
                joinRoom(roomId);
                setActiveTab('watch-room');
              }}
              onCreateRoomClick={() => setIsCreateModalOpen(true)}
              onExploreDiscover={() => setActiveTab('discover')}
              onSelectMovie={(movie) => setSelectedMovie(movie)}
              onFirewallClick={() => setIsFirewallOpen(true)}
            />
          )}

          {activeTab === 'watch-room' && (
            <WatchRoomView
              onCreateRoomClick={() => setIsCreateModalOpen(true)}
              onExploreDiscover={() => setActiveTab('discover')}
            />
          )}

          {activeTab === 'discover' && (
            <DiscoverView
              onSelectMovie={(movie) => setSelectedMovie(movie)}
              onStreamImmediately={handleWatchNow}
            />
          )}

          {activeTab === 'playlists' && <PlaylistsView />}

          {activeTab === 'profile' && (
            <ProfileSettingsView 
              onFirewallClick={() => setIsFirewallOpen(true)} 
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />

      <MultiClientSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      <FirewallSecurityModal
        isOpen={isFirewallOpen}
        onClose={() => setIsFirewallOpen(false)}
      />

      <MovieDetailsModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onWatchNow={handleWatchNow}
        onAddToQueue={handleAddToQueue}
      />
    </div>
  );
};

export default function App() {
  return (
    <RoomProvider>
      <MainLayout />
    </RoomProvider>
  );
}
