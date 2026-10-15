export interface MediaItem {
  id: string;
  title: string;
  year: number;
  duration: number; // in seconds
  genre: string[];
  synopsis: string;
  cast: string[];
  director: string;
  posterUrl: string;
  videoUrl: string;
  rating: number; // 0 - 10
  sourceType: 'open-cinema' | 'direct-stream' | 'short-film' | 'documentary';
}

export interface PlaylistItem {
  id: string;
  media: MediaItem;
  addedBy: {
    id: string;
    name: string;
  };
  addedAt: number;
  status: 'approved' | 'suggested';
}

export interface PlaybackState {
  media: MediaItem | null;
  status: 'playing' | 'paused';
  position: number; // seconds
  playbackRate: number;
  updatedAt: number; // server timestamp in ms
  sequenceNumber: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
  latencyMs: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  timestamp: number;
  xOffset?: number; // for visual variation
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdByName: string;
  createdAt: number;
  isActive: boolean;
  winningOptionId?: string;
}

export interface WatchRoom {
  id: string;
  title: string;
  hostId: string;
  playbackControl: 'all' | 'host-only';
  playback: PlaybackState;
  participants: Participant[];
  playlist: PlaylistItem[];
  chat: ChatMessage[];
  polls: Poll[];
  createdAt: number;
  isPermanent?: boolean;
  creatorUid?: string;
}

export interface RoomSummary {
  id: string;
  title: string;
  participantCount: number;
  currentMediaTitle: string | null;
  hostName: string;
  playbackStatus: 'playing' | 'paused';
  isPermanent?: boolean;
  creatorUid?: string;
}

export interface FirewallMetrics {
  status: 'active' | 'warning';
  inspectedRequests: number;
  blockedAttacks: number;
  activeRules: string[];
  uptimeSeconds: number;
  recentDetections: Array<{
    timestamp: number;
    type: string;
    target: string;
  }>;
}
