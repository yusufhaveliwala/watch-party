import React, { useState } from 'react';
import { 
  Play, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Plus, 
  Film, 
  Clock,
  Sparkles
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { MediaItem, PlaylistItem } from '../types/watchParty';
import { MOVIE_CATALOG } from '../data/movieCatalog';

export const PlaylistPanel: React.FC = () => {
  const { 
    room, 
    user, 
    isHost, 
    canControlPlayback, 
    sendPlaybackCommand, 
    sendPlaylistAction 
  } = useRoom();

  const [showCatalogModal, setShowCatalogModal] = useState(false);

  const playlist: PlaylistItem[] = room?.playlist || [];
  const currentMediaId = room?.playback.media?.id;

  const handlePlayNow = (item: PlaylistItem) => {
    if (!canControlPlayback) return;
    sendPlaybackCommand('change-media', { media: item.media, position: 0 });
  };

  const handleMove = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= playlist.length) return;
    sendPlaylistAction('reorder', { fromIndex, toIndex });
  };

  const handleRemove = (itemId: string) => {
    sendPlaylistAction('remove', { itemId });
  };

  const handleApprove = (itemId: string) => {
    sendPlaylistAction('approve', { itemId });
  };

  const handleReject = (itemId: string) => {
    sendPlaylistAction('reject', { itemId });
  };

  const handleAddMedia = (media: MediaItem) => {
    sendPlaylistAction('add', { item: media });
    setShowCatalogModal(false);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.round(secs / 60);
    return `${mins} min`;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[#E1EBE2] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E1EBE2] flex items-center justify-between bg-[#F8FAF6]">
        <div>
          <span className="text-sm font-bold text-[#20382B]">Shared Playlist</span>
          <span className="text-xs text-[#6B7C70] ml-1.5">({playlist.length} queued)</span>
        </div>
        <button
          onClick={() => setShowCatalogModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Media</span>
        </button>
      </div>

      {/* Playlist Items Scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[260px] max-h-[380px] lg:max-h-[500px]">
        {playlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6B7C70]">
            <Film className="w-8 h-8 text-[#A8D5BA] mb-2" />
            <p className="text-xs font-semibold text-[#20382B]">Playlist is empty</p>
            <p className="text-[11px] text-[#6B7C70] mt-0.5">
              Add films from our curated collection to watch together.
            </p>
            <button
              onClick={() => setShowCatalogModal(true)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-[#DDF3E4] text-[#20382B] text-xs font-medium hover:bg-[#A8D5BA] transition-colors"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          playlist.map((item, index) => {
            const isPlaying = currentMediaId === item.media.id;
            const isSuggested = item.status === 'suggested';

            return (
              <div
                key={item.id}
                className={`group p-2.5 rounded-xl border transition-all ${
                  isPlaying
                    ? 'bg-[#DDF3E4]/70 border-[#A8D5BA] shadow-xs'
                    : 'bg-white hover:bg-[#F8FAF6] border-[#E1EBE2]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Poster Thumbnail */}
                  <img
                    src={item.media.posterUrl}
                    alt={item.media.title}
                    className="w-12 h-16 rounded-md object-cover border border-[#E1EBE2] shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#20382B] truncate">
                        {item.media.title}
                      </span>
                      {isPlaying && (
                        <span className="text-[10px] font-semibold text-[#4C956C] bg-white px-1.5 py-0.5 rounded border border-[#A8D5BA]">
                          Now Playing
                        </span>
                      )}
                      {isSuggested && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Suggestion
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#6B7C70] mt-0.5">
                      {item.media.genre[0]} · {formatDuration(item.media.duration)} · Added by {item.addedBy.name}
                    </p>

                    {/* Suggestion Approval Actions (for host) */}
                    {isSuggested && isHost && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#4C956C] text-white text-[10px] font-medium hover:bg-[#3d7a57]"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-medium hover:bg-zinc-200"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions: Move Up, Move Down, Play, Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Play Button */}
                    {!isPlaying && item.status === 'approved' && canControlPlayback && (
                      <button
                        onClick={() => handlePlayNow(item)}
                        className="p-1 rounded text-[#4C956C] hover:bg-[#DDF3E4] transition-colors"
                        title="Stream this video now"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}

                    {/* Move controls */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-zinc-400 hover:text-[#20382B] disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === playlist.length - 1}
                        className="p-0.5 text-zinc-400 hover:text-[#20382B] disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove button */}
                    {(isHost || item.addedBy.id === user.id) && (
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Catalog Selector Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E1EBE2] w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[#E1EBE2] flex items-center justify-between bg-[#F8FAF6]">
              <div>
                <h3 className="text-sm font-bold text-[#20382B]">Add to Room Playlist</h3>
                <p className="text-xs text-[#6B7C70]">Select from high-definition open cinema</p>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {MOVIE_CATALOG.map((media) => (
                <div
                  key={media.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#E1EBE2] hover:border-[#A8D5BA] hover:bg-[#F8FAF6] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={media.posterUrl}
                      alt={media.title}
                      className="w-10 h-14 rounded object-cover border border-[#E1EBE2] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#20382B] truncate">{media.title}</p>
                      <p className="text-[11px] text-[#6B7C70]">
                        {media.genre.join(', ')} · {formatDuration(media.duration)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMedia(media)}
                    className="px-3 py-1.5 rounded-lg bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold shrink-0 transition-colors"
                  >
                    + Queue
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
