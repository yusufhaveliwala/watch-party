import React, { useState } from 'react';
import { 
  Radio, 
  MessageSquare, 
  ListVideo, 
  Vote, 
  Users, 
  Share2, 
  LogOut, 
  Crown, 
  Check, 
  Copy, 
  Sparkles,
  Tv,
  PlusCircle
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { SynchronizedPlayer } from '../components/SynchronizedPlayer';
import { ChatPanel } from '../components/ChatPanel';
import { PlaylistPanel } from '../components/PlaylistPanel';
import { PollsPanel } from '../components/PollsPanel';
import { ParticipantsPanel } from '../components/ParticipantsPanel';

type RoomTab = 'chat' | 'playlist' | 'polls' | 'participants';

interface WatchRoomViewProps {
  onCreateRoomClick: () => void;
  onExploreDiscover: () => void;
}

export const WatchRoomView: React.FC<WatchRoomViewProps> = ({
  onCreateRoomClick,
  onExploreDiscover
}) => {
  const { room, isHost, user, leaveRoom, joinRoom } = useRoom();
  const [activeTab, setActiveTab] = useState<RoomTab>('chat');
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    joinRoom(joinCodeInput.trim().toUpperCase());
  };

  // If not currently in any room, render intuitive zero-state
  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[75vh]">
        <div className="w-16 h-16 rounded-2xl bg-[#DDF3E4] border border-[#A8D5BA] flex items-center justify-center text-[#4C956C] mb-4 shadow-xs">
          <Tv className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-[#20382B] mb-1">
          No Active Watch Room
        </h2>

        <p className="text-xs text-[#6B7C70] mb-6 leading-relaxed">
          Create your own watch room with friends or enter a 6-character room code to join an ongoing party.
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={onCreateRoomClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Room</span>
          </button>

          <form onSubmit={handleManualJoin} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. CINEMA-1"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#E1EBE2] bg-white font-mono uppercase tracking-wider focus:outline-none focus:border-[#4C956C] text-[#20382B]"
            />
            <button
              type="submit"
              disabled={!joinCodeInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#20382B] hover:bg-black text-white text-xs font-semibold disabled:opacity-50"
            >
              Join
            </button>
          </form>

          <button
            onClick={() => joinRoom('CINEMA-1')}
            className="w-full text-xs text-[#4C956C] hover:underline pt-2 font-medium"
          >
            Or join the public Demo Room (CINEMA-1) &rarr;
          </button>
        </div>
      </div>
    );
  }

  const onlineCount = room.participants.filter(p => p.online).length;

  return (
    <div className="flex flex-col h-full p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full gap-4">
      {/* Room Top Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E1EBE2] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#DDF3E4] border border-[#A8D5BA] flex items-center justify-center text-[#4C956C] shrink-0">
            <Radio className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-[#20382B]">
                {room.title}
              </h1>
              <span className="font-mono text-xs font-bold text-[#4C956C] bg-[#DDF3E4] px-2 py-0.5 rounded border border-[#A8D5BA]">
                {room.id}
              </span>
              {isHost && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Crown className="w-3 h-3 text-amber-600" />
                  You are Host
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B7C70] mt-0.5">
              {onlineCount} {onlineCount === 1 ? 'person' : 'people'} in room &middot; Controls: {room.playbackControl === 'host-only' ? 'Host only' : 'Open'}
            </p>
          </div>
        </div>

        {/* Room Header Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#A8D5BA] bg-white hover:bg-[#DDF3E4] text-[#20382B] text-xs font-semibold transition-colors shadow-2xs"
            title="Copy shareable room link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#4C956C]" /> : <Share2 className="w-3.5 h-3.5 text-[#4C956C]" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Room'}</span>
          </button>

          <button
            onClick={leaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
            title="Leave this watch room"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left Video Player, Right Tabbed Social Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Video Player + Media Info) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <SynchronizedPlayer />
        </div>

        {/* Right Column (Social Sidebar with Tabs: Chat, Playlist, Polls, Participants) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          {/* Tab Selection Buttons */}
          <div className="grid grid-cols-4 p-1 bg-white rounded-xl border border-[#E1EBE2] shadow-2xs">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[#DDF3E4] text-[#20382B] shadow-2xs'
                  : 'text-[#6B7C70] hover:text-[#20382B]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('playlist')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'playlist'
                  ? 'bg-[#DDF3E4] text-[#20382B] shadow-2xs'
                  : 'text-[#6B7C70] hover:text-[#20382B]'
              }`}
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('polls')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'polls'
                  ? 'bg-[#DDF3E4] text-[#20382B] shadow-2xs'
                  : 'text-[#6B7C70] hover:text-[#20382B]'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Polls</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'participants'
                  ? 'bg-[#DDF3E4] text-[#20382B] shadow-2xs'
                  : 'text-[#6B7C70] hover:text-[#20382B]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="h-[460px] sm:h-[520px]">
            {activeTab === 'chat' && <ChatPanel />}
            {activeTab === 'playlist' && <PlaylistPanel />}
            {activeTab === 'polls' && <PollsPanel />}
            {activeTab === 'participants' && <ParticipantsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};
