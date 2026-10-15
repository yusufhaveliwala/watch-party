import React, { useState } from 'react';
import { 
  ListVideo, 
  Plus, 
  Play, 
  Trash2, 
  Film, 
  Clock, 
  Sparkles, 
  Share2,
  Check
} from 'lucide-react';
import { MOVIE_CATALOG } from '../data/movieCatalog';
import { MediaItem } from '../types/watchParty';
import { useRoom } from '../context/RoomContext';

interface CuratedPlaylist {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  items: MediaItem[];
}

export const PlaylistsView: React.FC = () => {
  const { room, sendPlaylistAction, sendPlaybackCommand, canControlPlayback } = useRoom();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const curatedPlaylists: CuratedPlaylist[] = [
    {
      id: 'pl-sci-fi',
      title: 'Open Sci-Fi & Animation Masterpieces',
      description: 'High-concept CGI animations and cyber-resistance short films from the Blender Open Cinema archive.',
      bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      items: [MOVIE_CATALOG[0], MOVIE_CATALOG[1], MOVIE_CATALOG[2], MOVIE_CATALOG[3]]
    },
    {
      id: 'pl-classics',
      title: 'Golden Hollywood Restorations',
      description: 'Audrey Hepburn, Cary Grant, and George Romero in iconic public domain cinematic prints.',
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      items: [MOVIE_CATALOG[7], MOVIE_CATALOG[8]]
    },
    {
      id: 'pl-nature',
      title: 'Earth Expeditions & Wilderness',
      description: 'Ultra high-definition nature explorations through untouched peaks and coastal reserves.',
      bannerUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      items: [MOVIE_CATALOG[5], MOVIE_CATALOG[6]]
    }
  ];

  const handleQueueAll = (playlist: CuratedPlaylist) => {
    if (!room) {
      alert('Please join or create a watch room first to load this playlist.');
      return;
    }
    playlist.items.forEach((media, idx) => {
      setTimeout(() => {
        sendPlaylistAction('add', { item: media });
      }, idx * 100);
    });
    setCopiedId(playlist.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleStreamFirst = (media: MediaItem) => {
    if (!room) {
      alert('Please join or create a watch room first.');
      return;
    }
    sendPlaybackCommand('change-media', { media, position: 0 });
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-[#20382B] tracking-tight">
          Watch Party Playlists
        </h1>
        <p className="text-xs text-[#6B7C70] mt-0.5">
          Curated thematic marathons and shared queues ready to import into your room
        </p>
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {curatedPlaylists.map((pl) => {
          const totalDurationSecs = pl.items.reduce((acc, it) => acc + it.duration, 0);
          const totalMins = Math.round(totalDurationSecs / 60);

          return (
            <div
              key={pl.id}
              className="rounded-2xl border border-[#E1EBE2] bg-white overflow-hidden shadow-xs hover:border-[#A8D5BA] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Banner */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                  <img
                    src={pl.bannerUrl}
                    alt={pl.title}
                    className="w-full h-full object-cover opacity-85"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[10px] font-semibold text-[#A8D5BA] uppercase tracking-wider block">
                      Curated Queue &middot; {pl.items.length} titles
                    </span>
                    <h3 className="text-sm font-bold leading-snug">{pl.title}</h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-[#6B7C70] leading-relaxed">
                    {pl.description}
                  </p>

                  {/* Track list preview */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-[#6B7C70] block">
                      Titles Included:
                    </span>
                    {pl.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#F8FAF6] border border-[#E1EBE2]"
                      >
                        <span className="text-[#20382B] font-medium truncate">
                          {idx + 1}. {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B7C70] shrink-0 ml-2">
                          {Math.round(item.duration / 60)}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="p-4 border-t border-[#E1EBE2] bg-[#F8FAF6] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#6B7C70] font-medium">
                  Runtime: {totalMins} min
                </span>

                <button
                  onClick={() => handleQueueAll(pl)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  {copiedId === pl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Loaded to Room!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Import to Room</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
