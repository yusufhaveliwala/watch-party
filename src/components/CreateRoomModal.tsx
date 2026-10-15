import React, { useState } from 'react';
import { 
  X, 
  Tv, 
  Shield, 
  Users, 
  Sparkles, 
  Infinity as InfinityIcon, 
  Check, 
  LogIn, 
  KeyRound, 
  CloudCheck 
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated
}) => {
  const { createRoom, user, firebaseUser, loginWithGoogle } = useRoom();
  const [title, setTitle] = useState('');
  const [playbackControl, setPlaybackControl] = useState<'all' | 'host-only'>('all');
  const [isPermanent, setIsPermanent] = useState(true); // Default to true as user requested permanent rooms
  const [customSlug, setCustomSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const cleanSlug = customSlug.trim() ? customSlug.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') : undefined;
      const newRoomId = await createRoom(title.trim(), playbackControl, isPermanent, cleanSlug);
      onRoomCreated(newRoomId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E1EBE2] w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E1EBE2] bg-[#F8FAF6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDF3E4] border border-[#A8D5BA] flex items-center justify-center text-[#4C956C]">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#20382B]">Create Watch Party Room</h2>
              <p className="text-xs text-[#6B7C70]">Start a synchronized screening with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Room Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#20382B]">
              Party Room Name
            </label>
            <input
              type="text"
              placeholder="e.g. Friday Indie Night, Anime Club, Family Cinema"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              maxLength={80}
              className="text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E1EBE2] focus:outline-none focus:border-[#4C956C] text-[#20382B]"
            />
          </div>

          {/* Permanent Room Option (Highlighted feature) */}
          <div className="p-3.5 rounded-2xl border border-[#A8D5BA] bg-[#DDF3E4]/30 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#A8D5BA] flex items-center justify-center text-[#4C956C] shrink-0 mt-0.5 shadow-2xs">
                  <InfinityIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#20382B] block">
                    Permanent Room (Never Expires)
                  </span>
                  <span className="text-[11px] text-[#6B7C70] leading-relaxed block mt-0.5">
                    Save this room permanently so everyone can return using the same link without recreating a new room every time.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className="w-4 h-4 text-[#4C956C] accent-[#4C956C] rounded cursor-pointer mt-1"
              />
            </div>

            {isPermanent && (
              <div className="pt-2 border-t border-[#A8D5BA]/50 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#20382B] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3 text-[#4C956C]" />
                    <span>Custom Room Code (Optional)</span>
                  </span>
                  <span className="text-[10px] text-[#6B7C70]">3-16 chars (e.g. MOVIE-NIGHT)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. INDIE-CLUB"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toUpperCase())}
                  maxLength={16}
                  className="font-mono text-xs uppercase px-3 py-2 rounded-lg border border-[#E1EBE2] bg-white focus:outline-none focus:border-[#4C956C] text-[#20382B]"
                />
              </div>
            )}
          </div>

          {/* Playback Permission Control */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#20382B]">
              Playback Permission Control
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPlaybackControl('all')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  playbackControl === 'all'
                    ? 'border-[#4C956C] bg-[#DDF3E4]/40 shadow-xs'
                    : 'border-[#E1EBE2] hover:bg-[#F8FAF6]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#20382B]">
                  <Users className="w-3.5 h-3.5 text-[#4C956C]" />
                  <span>Open Party</span>
                </div>
                <span className="text-[11px] text-[#6B7C70] leading-tight">
                  All participants can play, pause, and seek.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPlaybackControl('host-only')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  playbackControl === 'host-only'
                    ? 'border-[#4C956C] bg-[#DDF3E4]/40 shadow-xs'
                    : 'border-[#E1EBE2] hover:bg-[#F8FAF6]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#20382B]">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Host Guided</span>
                </div>
                <span className="text-[11px] text-[#6B7C70] leading-tight">
                  Only you (the host) can control the stream.
                </span>
              </button>
            </div>
          </div>

          {/* Google Sync Status Callout */}
          {firebaseUser ? (
            <div className="p-3 rounded-2xl bg-[#DDF3E4]/60 border border-[#A8D5BA] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <img
                  src={firebaseUser.photoURL || user.avatar}
                  alt={firebaseUser.displayName || 'Google user'}
                  className="w-7 h-7 rounded-full border border-[#4C956C] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="font-semibold text-[#20382B] block">
                    {firebaseUser.displayName || 'Google Account'}
                  </span>
                  <span className="text-[10px] text-[#6B7C70] flex items-center gap-1">
                    <CloudCheck className="w-3 h-3 text-[#4C956C]" />
                    <span>Syncs to Firebase Cloud automatically</span>
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#4C956C] bg-white px-2 py-0.5 rounded border border-[#A8D5BA]">
                Google Linked
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#F8FAF6] border border-[#E1EBE2] flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-semibold text-[#20382B] block">Sync with Firebase?</span>
                <span className="text-[10px] text-[#6B7C70]">Sign in with Google to preserve permanent rooms forever</span>
              </div>
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E1EBE2] hover:border-[#A8D5BA] text-xs font-semibold text-[#20382B] shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#4C956C]" />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E1EBE2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B7C70] hover:bg-[#F8FAF6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#4C956C] hover:bg-[#3d7a57] text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              {isLoading ? 'Creating Room...' : isPermanent ? 'Create Permanent Party' : 'Launch Watch Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
