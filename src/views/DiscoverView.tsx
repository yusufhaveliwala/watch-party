import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Play, 
  Plus, 
  Star, 
  Clock, 
  Compass, 
  ArrowUpDown, 
  Film,
  Sparkles
} from 'lucide-react';
import { MOVIE_CATALOG, GENRE_CATEGORIES } from '../data/movieCatalog';
import { MediaItem } from '../types/watchParty';
import { useRoom } from '../context/RoomContext';

interface DiscoverViewProps {
  onSelectMovie: (movie: MediaItem) => void;
  onStreamImmediately: (movie: MediaItem) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectMovie,
  onStreamImmediately
}) => {
  const { room, canControlPlayback, sendPlaylistAction } = useRoom();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'year' | 'title' | 'duration'>('rating');

  // Filter & Fuzzy Search Logic
  const filteredMovies = useMemo(() => {
    let result = [...MOVIE_CATALOG];

    // Filter by Genre
    if (selectedGenre !== 'All') {
      result = result.filter(m => m.genre.includes(selectedGenre));
    }

    // Fuzzy Search by title, cast, or director
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m => {
        const titleMatch = m.title.toLowerCase().includes(q);
        const castMatch = m.cast.some(c => c.toLowerCase().includes(q));
        const directorMatch = m.director.toLowerCase().includes(q);
        const genreMatch = m.genre.some(g => g.toLowerCase().includes(q));
        return titleMatch || castMatch || directorMatch || genreMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [searchQuery, selectedGenre, sortBy]);

  const handleQueue = (e: React.MouseEvent, movie: MediaItem) => {
    e.stopPropagation();
    if (!room) {
      alert('Join or create a room first to add movies to the playlist!');
      return;
    }
    sendPlaylistAction('add', { item: movie });
  };

  const handlePlayNow = (e: React.MouseEvent, movie: MediaItem) => {
    e.stopPropagation();
    onStreamImmediately(movie);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.round(secs / 60);
    return `${mins} min`;
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#20382B] tracking-tight">
            Discover Cinema
          </h1>
          <p className="text-xs text-[#6B7C70] mt-0.5">
            Curated open-access cinema, public domain restorations, and documentary releases
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#6B7C70] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search titles, actors, directors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E1EBE2] bg-white focus:outline-none focus:border-[#4C956C] text-[#20382B] shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Genre Filters & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E1EBE2]">
        {/* Genre Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {GENRE_CATEGORIES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedGenre === genre
                  ? 'bg-[#4C956C] text-white shadow-2xs'
                  : 'bg-white text-[#6B7C70] border border-[#E1EBE2] hover:text-[#20382B] hover:bg-[#F8FAF6]'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7C70]" />
          <span className="text-xs text-[#6B7C70] font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-white border border-[#E1EBE2] rounded-lg px-2.5 py-1.5 text-[#20382B] font-semibold focus:outline-none focus:border-[#4C956C]"
          >
            <option value="rating">Highest Rating</option>
            <option value="year">Release Year</option>
            <option value="duration">Runtime Length</option>
            <option value="title">Alphabetical Title</option>
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-[#E1EBE2] bg-white flex flex-col items-center justify-center">
          <Film className="w-10 h-10 text-[#A8D5BA] mb-2" />
          <h3 className="text-sm font-bold text-[#20382B]">No matching movies found</h3>
          <p className="text-xs text-[#6B7C70] mt-1 max-w-sm">
            Try adjusting your search query or select another genre category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('All');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#4C956C] text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="group cursor-pointer rounded-2xl border border-[#E1EBE2] bg-white overflow-hidden hover:border-[#A8D5BA] hover:shadow-md transition-all flex flex-col"
            >
              {/* Poster Frame */}
              <div className="relative aspect-3/4 overflow-hidden bg-zinc-900">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />

                {/* Rating badge */}
                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <span>{movie.rating.toFixed(1)}</span>
                </div>

                {/* Category tag */}
                <div className="absolute bottom-2.5 left-2.5 bg-[#4C956C] text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
                  {movie.genre[0]}
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#20382B] group-hover:text-[#4C956C] transition-colors line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-[11px] text-[#6B7C70] mt-0.5 line-clamp-1">
                    {movie.year} &middot; {formatDuration(movie.duration)} &middot; {movie.director}
                  </p>
                  <p className="text-[11px] text-[#6B7C70] mt-1.5 line-clamp-2 leading-relaxed">
                    {movie.synopsis}
                  </p>
                </div>

                {/* Card Quick Action Buttons */}
                <div className="pt-3 mt-3 border-t border-[#E1EBE2] flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleQueue(e, movie)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#F8FAF6] hover:bg-[#DDF3E4] border border-[#E1EBE2] text-[11px] font-semibold text-[#20382B] transition-colors"
                    title="Add to queue"
                  >
                    <Plus className="w-3 h-3 text-[#4C956C]" />
                    <span>Queue</span>
                  </button>

                  <button
                    onClick={(e) => handlePlayNow(e, movie)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#4C956C] hover:bg-[#3d7a57] text-[11px] font-semibold text-white transition-colors shadow-2xs"
                    title="Stream now"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
