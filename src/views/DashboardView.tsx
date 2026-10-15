import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Users, 
  PlusCircle, 
  Radio, 
  Sparkles, 
  ArrowRight, 
  Film, 
  Clock, 
  Wifi, 
  Compass, 
  Tv, 
  ShieldCheck,
  Check,
  Infinity as InfinityIcon,
  Bookmark,
  BookmarkCheck,
  LogIn,
  Trash2,
  Copy,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { MOVIE_CATALOG } from '../data/movieCatalog';
import { RoomSummary, MediaItem } from '../types/watchParty';

interface DashboardViewProps {
  onNavigateToRoom: (roomId: string) => void;
  onCreateRoomClick: () => void;
  onExploreDiscover: () => void;
  onSelectMovie: (movie: MediaItem) => void;
  onFirewallClick?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToRoom,
  onCreateRoomClick,
  onExploreDiscover,
  onSelectMovie,
  onFirewallClick
}) => {
  const { 
    room, 
    joinRoom, 
    p95Latency, 
    savedPermanentRoomIds, 
    toggleSavePermanentRoom,
    deletePermanentRoom,
    firebaseUser,
    loginWithGoogle,
    user
  } = useRoom();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRooms, setActiveRooms] = useState<RoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  // Fetch active rooms from server
  const fetchRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setActiveRooms(data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    const clean = roomCodeInput.trim().toUpperCase();
    joinRoom(clean);
    onNavigateToRoom(clean);
  };

  const handleCopyLink = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  // Find permanent rooms among active rooms or saved ids
  const permanentRooms = activeRooms.filter(r => r.isPermanent || savedPermanentRoomIds.includes(r.id));

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Hero Welcome & Quick Join Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E1EBE2] bg-gradient-to-br from-[#DDF3E4] via-white to-[#F8FAF6] p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#4C956C] bg-white px-2.5 py-1 rounded-full border border-[#A8D5BA] shadow-2xs">
              Synchronized Streaming &middot; Sub-500ms Drift
            </span>
            <span className="text-xs font-semibold text-[#20382B] bg-[#DDF3E4] px-2.5 py-1 rounded-full border border-[#A8D5BA] flex items-center gap-1">
              <InfinityIcon className="w-3.5 h-3.5 text-[#4C956C]" />
              <span>Permanent Rooms Supported</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#20382B] tracking-tight leading-tight">
            Stream movies and videos in lockstep with friends.
          </h1>

          <p className="text-sm sm:text-base text-[#6B7C70] leading-relaxed">
            Create permanent watch rooms that never expire. Sign in with Google to sync rooms and playlists to Firebase across all your devices, protected by an active Layer-7 firewall.
          </p>

          {/* Quick Join and Create Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter Room Code (e.g. CINEMA-1)"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={16}
                className="w-52 sm:w-64 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E1EBE2] bg-white font-mono uppercase tracking-wider focus:outline-none focus:border-[#4C956C] text-[#20382B] shadow-2xs"
              />
              <button
                type="submit"
                disabled={!roomCodeInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#20382B] hover:bg-black text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 shadow-xs cursor-pointer"
              >
                Join Room
              </button>
            </form>

            <div className="hidden sm:block text-xs text-[#6B7C70] font-medium px-1">or</div>

            <button
              onClick={onCreateRoomClick}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Permanent Room</span>
            </button>
          </div>
        </div>

        {/* Decorative corner illustration badge */}
        <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-2 opacity-90 pointer-events-none">
          <div className="w-48 h-48 rounded-3xl bg-[#DDF3E4] border border-[#A8D5BA] p-4.5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#4C956C]">
              <span className="font-semibold">Sync & Firewall</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-[#6B7C70]">Cloud Persistence</p>
              <p className="font-mono text-lg font-bold text-[#20382B]">Firebase & Disk</p>
            </div>
            <div className="text-[10px] text-[#4C956C] font-medium flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Permanent Rooms Safe</span>
            </div>
          </div>
        </div>
      </div>


      {/* Current Room Alert Banner (if user is currently in a room) */}
      {room && (
        <div className="p-4 rounded-2xl bg-[#DDF3E4] border border-[#A8D5BA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#A8D5BA] flex items-center justify-center text-[#4C956C] shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#20382B]">You are currently in:</span>
                <span className="text-xs font-mono font-bold text-[#4C956C] bg-white px-2 py-0.5 rounded border border-[#A8D5BA]">
                  {room.id}
                </span>
                <span className="text-xs text-[#20382B] font-semibold">{room.title}</span>
                {room.isPermanent && (
                  <span className="text-[10px] font-bold text-[#4C956C] bg-white px-1.5 py-0.2 rounded border border-[#A8D5BA] flex items-center gap-1">
                    <InfinityIcon className="w-3 h-3" />
                    <span>Permanent</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7C70] mt-0.5">
                Streaming: {room.playback.media?.title || 'Nothing queued'} · {room.participants.filter(p => p.online).length} participants
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToRoom(room.id)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <span>Return to Watch Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Permanent Rooms Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InfinityIcon className="w-5 h-5 text-[#4C956C]" />
            <div>
              <h2 className="text-lg font-bold text-[#20382B]">Permanent Watch Rooms</h2>
              <p className="text-xs text-[#6B7C70]">Persistent rooms that never expire — rejoin anytime with friends</p>
            </div>
          </div>
          {!firebaseUser && (
            <button
              onClick={loginWithGoogle}
              className="text-xs text-[#4C956C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google to sync</span>
            </button>
          )}
        </div>

        {permanentRooms.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[#A8D5BA] bg-[#DDF3E4]/20 text-center flex flex-col items-center justify-center">
            <InfinityIcon className="w-8 h-8 text-[#4C956C] mb-2" />
            <p className="text-sm font-bold text-[#20382B]">No permanent rooms saved yet</p>
            <p className="text-xs text-[#6B7C70] mt-0.5 mb-3 max-w-md">
              Create a permanent room with your own custom room code (e.g. FAMILY-CINEMA) so you never have to generate a new link again.
            </p>
            <button
              onClick={onCreateRoomClick}
              className="px-4 py-2 rounded-xl bg-[#4C956C] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              Create Permanent Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permanentRooms.map((r) => {
              const isSaved = savedPermanentRoomIds.includes(r.id);
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border-2 border-[#A8D5BA] bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-3 relative"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#4C956C] bg-[#DDF3E4] px-2 py-0.5 rounded">
                          {r.id}
                        </span>
                        <span className="text-[10px] font-bold text-[#4C956C] bg-[#DDF3E4]/60 px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#A8D5BA]">
                          <InfinityIcon className="w-3 h-3" />
                          <span>Permanent</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleCopyLink(r.id, e)}
                          className="p-1 rounded text-[#6B7C70] hover:text-[#20382B] hover:bg-[#F8FAF6] transition-colors"
                          title="Copy permanent invite link"
                        >
                          {copiedRoomId === r.id ? (
                            <Check className="w-3.5 h-3.5 text-[#4C956C]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleSavePermanentRoom(r.id)}
                          className="p-1 rounded text-[#4C956C] hover:bg-[#DDF3E4] transition-colors"
                          title={isSaved ? "Saved to permanent rooms" : "Save room"}
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#20382B] line-clamp-1">
                      {r.title}
                    </h3>

                    <p className="text-xs text-[#6B7C70] mt-1 line-clamp-1">
                      {r.currentMediaTitle ? `Current: ${r.currentMediaTitle}` : 'Ready for video selection'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E1EBE2]">
                    <span className="text-[11px] text-[#6B7C70]">
                      {r.participantCount} watching
                    </span>
                    <button
                      onClick={() => {
                        joinRoom(r.id);
                        onNavigateToRoom(r.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Enter Room</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Watch Parties Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#20382B]">All Active Watch Parties</h2>
            <p className="text-xs text-[#6B7C70]">Join an ongoing virtual screening room or browse lobbies</p>
          </div>
          <button
            onClick={fetchRooms}
            className="text-xs text-[#4C956C] font-semibold hover:underline cursor-pointer"
          >
            Refresh List
          </button>
        </div>

        {activeRooms.length === 0 ? (
          <div className="p-8 rounded-2xl border border-[#E1EBE2] bg-white text-center flex flex-col items-center justify-center">
            <Tv className="w-8 h-8 text-[#A8D5BA] mb-2" />
            <p className="text-sm font-bold text-[#20382B]">No active watch rooms right now</p>
            <p className="text-xs text-[#6B7C70] mt-0.5 mb-3">
              Be the first to launch a room and invite your friends.
            </p>
            <button
              onClick={onCreateRoomClick}
              className="px-4 py-2 rounded-xl bg-[#4C956C] text-white text-xs font-semibold cursor-pointer"
            >
              Create Party
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRooms.map((r) => {
              const isSaved = savedPermanentRoomIds.includes(r.id);
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-[#E1EBE2] bg-white hover:border-[#A8D5BA] hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#4C956C] bg-[#DDF3E4] px-2 py-0.5 rounded">
                          {r.id}
                        </span>
                        {r.isPermanent && (
                          <span className="text-[10px] font-bold text-[#4C956C] bg-[#DDF3E4]/60 px-1.5 py-0.2 rounded border border-[#A8D5BA] flex items-center gap-1">
                            <InfinityIcon className="w-3 h-3" />
                            <span>Permanent</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleSavePermanentRoom(r.id)}
                          className={`p-1 rounded transition-colors ${
                            isSaved ? 'text-[#4C956C]' : 'text-zinc-400 hover:text-zinc-600'
                          }`}
                          title={isSaved ? "Saved permanently" : "Save room code"}
                        >
                          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-[11px] text-[#6B7C70] flex items-center gap-1 ml-1">
                          <Users className="w-3 h-3 text-[#4C956C]" />
                          {r.participantCount}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#20382B] line-clamp-1">
                      {r.title}
                    </h3>

                    <p className="text-xs text-[#6B7C70] mt-1 line-clamp-1">
                      {r.currentMediaTitle ? `Watching: ${r.currentMediaTitle}` : 'Waiting for video selection'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E1EBE2]">
                    <span className="text-[11px] text-[#6B7C70]">
                      Host: <strong>{r.hostName}</strong>
                    </span>
                    <button
                      onClick={() => {
                        joinRoom(r.id);
                        onNavigateToRoom(r.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Join</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Curated Cinema Discovery Spotlight */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#20382B]">Curated Movies Ready to Stream</h2>
            <p className="text-xs text-[#6B7C70]">Open-access cinema and high-definition documentaries</p>
          </div>
          <button
            onClick={onExploreDiscover}
            className="text-xs text-[#4C956C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {MOVIE_CATALOG.slice(0, 4).map((movie) => (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="group cursor-pointer rounded-2xl border border-[#E1EBE2] bg-white overflow-hidden hover:border-[#A8D5BA] hover:shadow-sm transition-all flex flex-col"
            >
              <div className="relative aspect-3/4 overflow-hidden bg-zinc-100">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs">
                  ★ {movie.rating.toFixed(1)}
                </div>
                <div className="absolute bottom-2 left-2 bg-[#4C956C] text-white text-[10px] font-medium px-2 py-0.5 rounded">
                  {movie.genre[0]}
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#20382B] group-hover:text-[#4C956C] transition-colors line-clamp-1">
                    {movie.title}
                  </h4>
                  <p className="text-[11px] text-[#6B7C70] mt-0.5">
                    {movie.year} &middot; {Math.round(movie.duration / 60)} min
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-[#E1EBE2] flex items-center justify-between text-[11px] text-[#4C956C] font-medium">
                  <span>Stream Details</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
