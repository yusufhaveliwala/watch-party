import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Check, 
  Wifi, 
  ShieldCheck, 
  Sliders, 
  RefreshCw,
  Sparkles,
  LogIn,
  LogOut,
  Infinity as InfinityIcon,
  Trash2,
  ExternalLink,
  Copy,
  Lock,
  CloudCheck
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';

const AVATAR_SEEDS = [
  'Fern', 'Sage', 'Rowan', 'Cedar', 'Willow', 
  'Jasper', 'Flora', 'Moss', 'Laurel', 'Breeze',
  'Orion', 'Luna', 'Nova', 'Echo', 'Atlas'
];

interface ProfileSettingsViewProps {
  onFirewallClick?: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({ onFirewallClick }) => {
  const { 
    user, 
    updateUserProfile, 
    connectionStatus, 
    latencyMs, 
    p95Latency,
    room,
    firebaseUser,
    loginWithGoogle,
    logout,
    savedPermanentRoomIds,
    deletePermanentRoom,
    joinRoom
  } = useRoom();

  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [driftTolerance, setDriftTolerance] = useState('500');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [wafData, setWafData] = useState<{ inspectedRequests: number; blockedAttacks: number } | null>(null);

  useEffect(() => {
    fetch('/api/firewall/status')
      .then(res => res.json())
      .then(d => setWafData(d))
      .catch(() => {});
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateUserProfile(name.trim(), selectedAvatar);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSelectSeed = (seed: string) => {
    const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    setSelectedAvatar(url);
  };

  const handleRandomize = () => {
    const rand = Math.random().toString(36).substring(2, 8);
    setSelectedAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${rand}`);
  };

  const handleCopyLink = (roomId: string) => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-[#20382B] tracking-tight">
          Account, Cloud Sync & Security
        </h1>
        <p className="text-xs text-[#6B7C70] mt-0.5">
          Manage your Google authentication, permanent rooms in Firebase, and firewall telemetry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Google Auth + Permanent Rooms + Profile */}
        <div className="md:col-span-2 space-y-6">
          {/* Google Firebase Sync Card */}
          <div className="p-5 sm:p-6 rounded-3xl border border-[#A8D5BA] bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1EBE2] pb-3">
              <div className="flex items-center gap-2">
                <CloudCheck className="w-4 h-4 text-[#4C956C]" />
                <h2 className="text-sm font-bold text-[#20382B]">Google Authentication & Firebase Sync</h2>
              </div>
              <span className="text-[10px] font-mono text-[#4C956C] bg-[#DDF3E4] px-2 py-0.5 rounded-full border border-[#A8D5BA]">
                {firebaseUser ? 'Synced' : 'Guest'}
              </span>
            </div>

            {firebaseUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#DDF3E4]/30 border border-[#A8D5BA]">
                <div className="flex items-center gap-3">
                  <img
                    src={firebaseUser.photoURL || user.avatar}
                    alt={firebaseUser.displayName || 'Google Profile'}
                    className="w-12 h-12 rounded-full border-2 border-[#4C956C] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-[#20382B]">
                      {firebaseUser.displayName || 'Google Member'}
                    </h3>
                    <p className="text-xs text-[#6B7C70]">{firebaseUser.email}</p>
                    <span className="text-[10px] text-[#4C956C] font-semibold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3" />
                      <span>Permanent rooms saved to Firestore cloud</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E1EBE2] hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold text-[#20382B] transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#E1EBE2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-[#20382B]">Connect Google Account</h3>
                  <p className="text-[11px] text-[#6B7C70] leading-relaxed">
                    Sign in with Google to synchronize your permanent rooms, favorites, and playlists to Firebase. Rejoin from any phone or computer without losing your room IDs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Permanent Rooms Management */}
          <div className="p-5 sm:p-6 rounded-3xl border border-[#E1EBE2] bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1EBE2] pb-3">
              <div className="flex items-center gap-2">
                <InfinityIcon className="w-4 h-4 text-[#4C956C]" />
                <h2 className="text-sm font-bold text-[#20382B]">My Saved Permanent Rooms</h2>
              </div>
              <span className="text-xs font-semibold text-[#6B7C70]">
                {savedPermanentRoomIds.length} saved
              </span>
            </div>

            {savedPermanentRoomIds.length === 0 ? (
              <p className="text-xs text-[#6B7C70] py-2">
                No permanent rooms saved. Create a permanent room from the dashboard to keep it forever.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedPermanentRoomIds.map((roomId) => (
                  <div
                    key={roomId}
                    className="p-3 rounded-2xl border border-[#E1EBE2] bg-[#F8FAF6] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-[#4C956C] bg-white px-2 py-0.5 rounded border border-[#A8D5BA]">
                        {roomId}
                      </span>
                      <span className="text-[#6B7C70] text-[11px] truncate">
                        Permanent Watch Party
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyLink(roomId)}
                        className="p-1.5 rounded-lg text-[#6B7C70] hover:text-[#20382B] hover:bg-white transition-colors"
                        title="Copy permanent invite link"
                      >
                        {copiedId === roomId ? (
                          <Check className="w-3.5 h-3.5 text-[#4C956C]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => joinRoom(roomId)}
                        className="px-2.5 py-1 rounded-lg bg-[#4C956C] hover:bg-[#3d7a57] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Enter
                      </button>

                      <button
                        onClick={() => deletePermanentRoom(roomId)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-white transition-colors"
                        title="Remove room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Participant Profile Form */}
          <form 
            onSubmit={handleSaveProfile}
            className="p-5 sm:p-6 rounded-3xl border border-[#E1EBE2] bg-white shadow-xs space-y-5"
          >
            <div className="flex items-center gap-2 border-b border-[#E1EBE2] pb-3">
              <User className="w-4 h-4 text-[#4C956C]" />
              <h2 className="text-sm font-bold text-[#20382B]">Watch Party Identity & Avatar</h2>
            </div>

            {/* Avatar Preview & Seeds */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#20382B] block">
                Choose Avatar
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={selectedAvatar}
                  alt="Selected avatar"
                  className="w-16 h-16 rounded-2xl bg-[#DDF3E4] border-2 border-[#4C956C] p-1 object-cover shadow-2xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E1EBE2] hover:bg-[#F8FAF6] text-xs font-semibold text-[#20382B] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#4C956C]" />
                    <span>Generate Random</span>
                  </button>
                  <p className="text-[11px] text-[#6B7C70] mt-1">
                    Or pick a preset character below
                  </p>
                </div>
              </div>

              {/* Seed picker */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {AVATAR_SEEDS.map((seed) => {
                  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                  const isChosen = selectedAvatar === avatarUrl;
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => handleSelectSeed(seed)}
                      className={`w-9 h-9 rounded-xl border p-0.5 transition-all cursor-pointer ${
                        isChosen
                          ? 'border-[#4C956C] bg-[#DDF3E4] scale-105 shadow-2xs'
                          : 'border-[#E1EBE2] hover:border-[#A8D5BA] bg-white'
                      }`}
                      title={seed}
                    >
                      <img
                        src={avatarUrl}
                        alt={seed}
                        className="w-full h-full rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#20382B] block">
                Display Name in Rooms
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={30}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E1EBE2] bg-white focus:outline-none focus:border-[#4C956C] text-[#20382B]"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E1EBE2]">
              {saveSuccess ? (
                <span className="text-xs font-semibold text-[#4C956C] flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>Profile updated!</span>
                </span>
              ) : (
                <span className="text-[11px] text-[#6B7C70]">
                  Changes apply instantly across rooms
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Save Identity
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Firewall Telemetry & Connection Diagnostics */}
        <div className="space-y-6">
          {/* Firewall Security Card */}
          <div className="p-5 rounded-3xl border border-[#A8D5BA] bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1EBE2] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4C956C]" />
                <h3 className="text-sm font-bold text-[#20382B]">Site Firewall (WAF)</h3>
              </div>
              <span className="text-[10px] font-bold text-[#4C956C] bg-[#DDF3E4] px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#E1EBE2]">
                <span className="text-[#6B7C70]">Inspection Engine:</span>
                <span className="font-semibold text-[#20382B]">Layer 7 DPI</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#E1EBE2]">
                <span className="text-[#6B7C70]">Inspected Requests:</span>
                <span className="font-mono font-bold text-[#20382B]">
                  {wafData?.inspectedRequests ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#E1EBE2]">
                <span className="text-[#6B7C70]">Blocked Threats:</span>
                <span className="font-mono font-bold text-rose-700">
                  {wafData?.blockedAttacks ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#6B7C70]">Rate Limit Guard:</span>
                <span className="font-semibold text-[#4C956C]">150 req/min</span>
              </div>
            </div>

            {onFirewallClick && (
              <button
                type="button"
                onClick={onFirewallClick}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#DDF3E4] hover:bg-[#cbead5] text-[#20382B] text-xs font-bold transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#4C956C]" />
                <span>Launch Security Console</span>
              </button>
            )}
          </div>

          {/* Network Health */}
          <div className="p-5 rounded-3xl border border-[#E1EBE2] bg-white shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E1EBE2] pb-3">
              <Wifi className="w-4 h-4 text-[#4C956C]" />
              <h3 className="text-sm font-bold text-[#20382B]">Network Health</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#E1EBE2]">
                <span className="text-[#6B7C70]">Socket State:</span>
                <span className="font-semibold text-[#4C956C] capitalize flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4C956C]" />
                  {connectionStatus}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E1EBE2]">
                <span className="text-[#6B7C70]">Current Latency:</span>
                <span className="font-mono font-semibold text-[#20382B]">
                  {latencyMs} ms
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E1EBE2]">
                <span className="text-[#6B7C70]">p95 Propagation:</span>
                <span className="font-mono font-semibold text-[#20382B]">
                  {p95Latency || 18} ms
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#6B7C70]">Current Room:</span>
                <span className="font-mono font-semibold text-[#4C956C]">
                  {room ? room.id : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
