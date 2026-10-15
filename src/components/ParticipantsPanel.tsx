import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  Share2, 
  Copy, 
  Check, 
  Settings, 
  UserMinus, 
  ShieldCheck, 
  SlidersHorizontal,
  Wifi,
  Bookmark,
  BookmarkCheck,
  Infinity as InfinityIcon
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { Participant } from '../types/watchParty';

export const ParticipantsPanel: React.FC = () => {
  const { room, user, isHost, sendHostAction, toggleSavePermanentRoom, savedPermanentRoomIds } = useRoom();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTitle, setNewTitle] = useState(room?.title || '');

  const participants: Participant[] = room?.participants || [];
  const onlineCount = participants.filter(p => p.online).length;

  const handleCopyInvite = () => {
    if (!room) return;
    const url = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTransferHost = (targetUserId: string) => {
    if (!isHost) return;
    if (confirm('Are you sure you want to transfer host privileges to this participant?')) {
      sendHostAction('transfer', { targetUserId });
    }
  };

  const handleKick = (targetUserId: string) => {
    if (!isHost) return;
    if (confirm('Remove this user from the room?')) {
      sendHostAction('kick', { targetUserId });
    }
  };

  const handleToggleControlMode = () => {
    if (!isHost || !room) return;
    const nextMode = room.playbackControl === 'all' ? 'host-only' : 'all';
    sendHostAction('update-settings', { settings: { playbackControl: nextMode } });
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHost || !newTitle.trim()) return;
    sendHostAction('update-settings', { settings: { title: newTitle.trim() } });
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[#E1EBE2] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E1EBE2] flex items-center justify-between bg-[#F8FAF6]">
        <div>
          <span className="text-sm font-bold text-[#20382B]">Participants</span>
          <span className="text-xs text-[#6B7C70] ml-1.5">({onlineCount} online)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#A8D5BA] hover:bg-[#DDF3E4] text-[#20382B] text-xs font-medium transition-colors"
            title="Copy invitation link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#4C956C]" /> : <Share2 className="w-3.5 h-3.5 text-[#4C956C]" />}
            <span>{copiedLink ? 'Copied!' : 'Invite'}</span>
          </button>
          {isHost && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showSettings 
                  ? 'bg-[#4C956C] text-white border-[#4C956C]' 
                  : 'bg-white border-[#E1EBE2] text-[#6B7C70] hover:text-[#20382B]'
              }`}
              title="Room Host Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Room Invitation Card */}
      <div className="p-3 bg-[#F8FAF6] border-b border-[#E1EBE2] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#6B7C70] block">Room Code</span>
            {room?.isPermanent && (
              <span className="text-[9px] font-bold text-[#4C956C] bg-[#DDF3E4] px-1.5 py-0.2 rounded flex items-center gap-0.5 border border-[#A8D5BA]">
                <InfinityIcon className="w-2.5 h-2.5" />
                Permanent
              </span>
            )}
          </div>
          <span className="font-mono text-sm font-bold text-[#20382B]">{room?.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {room && (
            <button
              onClick={() => toggleSavePermanentRoom(room.id)}
              className="p-1 rounded text-[#4C956C] hover:bg-[#DDF3E4] transition-colors"
              title={savedPermanentRoomIds.includes(room.id) ? "Saved in your permanent rooms" : "Save this room code permanently"}
            >
              {savedPermanentRoomIds.includes(room.id) ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={handleCopyInvite}
            className="text-xs text-[#4C956C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </button>
        </div>
      </div>

      {/* Host Settings Drawer */}
      {showSettings && isHost && (
        <div className="p-3.5 bg-amber-50/50 border-b border-amber-200/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#20382B] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#4C956C]" />
              Host Management Settings
            </span>
          </div>

          <form onSubmit={handleSaveTitle} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Room Name"
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#E1EBE2] bg-white focus:outline-none focus:border-[#4C956C]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#4C956C] text-white text-xs font-semibold"
            >
              Save
            </button>
          </form>

          {/* Playback Control Permission Switch */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-semibold text-[#20382B]">Playback Permission</p>
              <p className="text-[10px] text-[#6B7C70]">
                {room?.playbackControl === 'all' 
                  ? 'All participants can play/pause/seek' 
                  : 'Only Room Host can play/pause/seek'}
              </p>
            </div>
            <button
              onClick={handleToggleControlMode}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                room?.playbackControl === 'host-only'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-[#DDF3E4] text-[#20382B] border-[#A8D5BA]'
              }`}
            >
              {room?.playbackControl === 'host-only' ? 'Host Only' : 'Everyone'}
            </button>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[260px] max-h-[380px] lg:max-h-[500px]">
        {participants.map((p) => {
          const isSelf = p.id === user.id;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                p.online ? 'bg-white border-[#E1EBE2]' : 'bg-[#F8FAF6] border-zinc-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-8 h-8 rounded-full bg-[#DDF3E4] border border-[#A8D5BA] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      p.online ? 'bg-[#4C956C]' : 'bg-zinc-400'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#20382B] truncate">
                      {p.name} {isSelf && '(You)'}
                    </span>
                    {p.isHost && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                        Host
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#6B7C70] mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Wifi className="w-2.5 h-2.5 text-[#4C956C]" />
                      {p.latencyMs || 18}ms
                    </span>
                    <span>·</span>
                    <span>{p.online ? 'In room' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>

              {/* Host actions on other participants */}
              {isHost && !isSelf && p.online && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTransferHost(p.id)}
                    className="px-2 py-1 rounded text-[10px] font-medium text-[#4C956C] hover:bg-[#DDF3E4] transition-colors"
                    title="Make this user the Room Host"
                  >
                    Make Host
                  </button>
                  <button
                    onClick={() => handleKick(p.id)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove user"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
