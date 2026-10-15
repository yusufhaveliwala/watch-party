import React from 'react';
import { X, Play, Plus, Film, Clock, Star, User } from 'lucide-react';
import { MediaItem } from '../types/watchParty';
import { useRoom } from '../context/RoomContext';

interface MovieDetailsModalProps {
  movie: MediaItem | null;
  onClose: () => void;
  onWatchNow: (movie: MediaItem) => void;
  onAddToQueue: (movie: MediaItem) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onClose,
  onWatchNow,
  onAddToQueue
}) => {
  const { room, canControlPlayback } = useRoom();

  if (!movie) return null;

  const formatDuration = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E1EBE2] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header / Banner Area */}
        <div className="relative aspect-video max-h-56 w-full bg-zinc-900 overflow-hidden">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#A8D5BA] bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                {movie.genre.join(' · ')}
              </span>
              <span className="text-xs text-zinc-300">({movie.year})</span>
            </div>
            <h2 className="text-xl font-bold leading-tight">{movie.title}</h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Metadata pill-free strip */}
          <div className="flex items-center gap-4 text-xs text-[#6B7C70] border-b border-[#E1EBE2] pb-3">
            <span className="flex items-center gap-1 font-semibold text-[#4C956C]">
              <Star className="w-3.5 h-3.5 fill-current" />
              {movie.rating.toFixed(1)} / 10
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(movie.duration)}
            </span>
            <span>·</span>
            <span>Director: {movie.director}</span>
          </div>

          {/* Synopsis */}
          <div>
            <h4 className="text-xs font-bold text-[#20382B] mb-1">Synopsis</h4>
            <p className="text-xs text-[#6B7C70] leading-relaxed">
              {movie.synopsis}
            </p>
          </div>

          {/* Cast */}
          <div>
            <h4 className="text-xs font-bold text-[#20382B] mb-1.5">Featured Cast</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {movie.cast.map((actor, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium text-[#20382B] bg-[#F8FAF6] border border-[#E1EBE2] px-2.5 py-1 rounded-md"
                >
                  {actor}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-[#E1EBE2] bg-[#F8FAF6] flex items-center justify-between gap-3">
          <button
            onClick={() => onAddToQueue(movie)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E1EBE2] hover:bg-[#DDF3E4] text-[#20382B] text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#4C956C]" />
            <span>Add to Party Queue</span>
          </button>

          <button
            onClick={() => onWatchNow(movie)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Stream in Room Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
