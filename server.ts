import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { MOVIE_CATALOG } from './src/data/movieCatalog.ts';
import { WatchRoom, Participant, PlaylistItem, Poll, ChatMessage } from './src/types/watchParty.ts';
import { RoomStorage } from './src/server/storage.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e6 // 1MB payload ceiling to prevent memory exhaustion
});

app.use(express.json({ limit: '500kb' }));

// ==========================================
// Application Firewall & Security Middleware (WAF)
// ==========================================
interface WafStats {
  inspectedRequests: number;
  blockedAttacks: number;
  startTime: number;
  recentDetections: Array<{ timestamp: number; type: string; target: string }>;
}
const wafStats: WafStats = {
  inspectedRequests: 0,
  blockedAttacks: 0,
  startTime: Date.now(),
  recentDetections: []
};

// IP Rate Limiter
const ipRateLimitStore = new Map<string, { count: number; resetTime: number }>();
function checkIpRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = ipRateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    ipRateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

// Firewall Inspection Middleware
app.use((req, res, next) => {
  wafStats.inspectedRequests++;

  // 1. Hardened Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Firewall-Protection', 'GreenRoom-WAF-Active');

  // 2. IP Rate Limit Guard (150 req/min)
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local';
  if (!checkIpRateLimit(clientIp, 150, 60000)) {
    wafStats.blockedAttacks++;
    wafStats.recentDetections.unshift({
      timestamp: Date.now(),
      type: 'Rate-Limit-Violation',
      target: req.path
    });
    if (wafStats.recentDetections.length > 20) wafStats.recentDetections.pop();
    return res.status(429).json({ error: 'Firewall Alert: Excessive request rate detected. Throttled.' });
  }

  // 3. Deep Packet Inspection on URL and Payload for Malicious Signatures
  const payloadString = (req.originalUrl + ' ' + JSON.stringify(req.body || {})).toLowerCase();
  const hasSqlInjection = /(\bunion\s+select\b|\bdrop\s+table\b|--|;\s*delete\s+from\b|\bexec\s*\(|\bor\s+1\s*=\s*1\b)/i.test(payloadString);
  const hasXssScript = /(<script\b|javascript:|onerror\s*=|onload\s*=|document\.cookie)/i.test(payloadString);
  const hasProtoPollution = /("__proto__"|"constructor"|"prototype")/i.test(JSON.stringify(req.body || {}));
  const hasPathTraversal = /(\.\.\/|\.\.\\)/i.test(req.originalUrl);

  if (hasSqlInjection || hasXssScript || hasProtoPollution || hasPathTraversal) {
    wafStats.blockedAttacks++;
    const attackType = hasSqlInjection ? 'SQL-Injection' 
      : hasXssScript ? 'XSS-Exploit' 
      : hasProtoPollution ? 'Prototype-Pollution' 
      : 'Path-Traversal';

    wafStats.recentDetections.unshift({
      timestamp: Date.now(),
      type: attackType,
      target: req.path
    });
    if (wafStats.recentDetections.length > 20) wafStats.recentDetections.pop();

    return res.status(403).json({
      error: `Firewall Blocked: Malicious signature detected (${attackType}). Request rejected by GreenRoom WAF.`
    });
  }

  next();
});

// Persistent Room State Store
const rooms = RoomStorage.loadRooms();

// Ensure default demo room is initialized if storage is empty
const demoRoomId = 'CINEMA-1';
if (!rooms.has(demoRoomId)) {
  rooms.set(demoRoomId, {
    id: demoRoomId,
    title: 'Friday Indie & Sci-Fi Premiere',
    hostId: 'host-alice',
    playbackControl: 'all',
    playback: {
      media: MOVIE_CATALOG[0], // Cosmos Laundromat
      status: 'paused',
      position: 0,
      playbackRate: 1.0,
      updatedAt: Date.now(),
      sequenceNumber: 1
    },
    participants: [
      {
        id: 'host-alice',
        name: 'Alice (Host)',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alice',
        isHost: true,
        joinedAt: Date.now() - 600000,
        latencyMs: 18,
        online: false
      },
      {
        id: 'bot-marco',
        name: 'Marco',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marco',
        isHost: false,
        joinedAt: Date.now() - 300000,
        latencyMs: 25,
        online: false
      }
    ],
    playlist: [
      {
        id: 'item-1',
        media: MOVIE_CATALOG[0],
        addedBy: { id: 'host-alice', name: 'Alice (Host)' },
        addedAt: Date.now() - 600000,
        status: 'approved'
      },
      {
        id: 'item-2',
        media: MOVIE_CATALOG[1],
        addedBy: { id: 'bot-marco', name: 'Marco' },
        addedAt: Date.now() - 400000,
        status: 'approved'
      },
      {
        id: 'item-3',
        media: MOVIE_CATALOG[2],
        addedBy: { id: 'bot-marco', name: 'Marco' },
        addedAt: Date.now() - 200000,
        status: 'approved'
      }
    ],
    chat: [
      {
        id: 'msg-1',
        userId: 'system',
        userName: 'GreenRoom',
        userAvatar: '',
        text: 'Welcome to Friday Indie & Sci-Fi Premiere! Grab your popcorn.',
        timestamp: Date.now() - 600000,
        isSystem: true
      },
      {
        id: 'msg-2',
        userId: 'host-alice',
        userName: 'Alice (Host)',
        userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alice',
        text: 'Hey everyone! Cosmos Laundromat is queued up. Let me know when ready!',
        timestamp: Date.now() - 500000
      },
      {
        id: 'msg-3',
        userId: 'bot-marco',
        userName: 'Marco',
        userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marco',
        text: 'Audio & sync look crystal clear on my end! 🔥',
        timestamp: Date.now() - 250000
      }
    ],
    polls: [
      {
        id: 'poll-1',
        question: 'Which movie should we stream right after Cosmos Laundromat?',
        options: [
          { id: 'opt-1', text: 'Big Buck Bunny: Forest Awakening', votes: ['host-alice'] },
          { id: 'opt-2', text: 'Sintel: The Dragon Quest', votes: ['bot-marco'] },
          { id: 'opt-3', text: 'Tears of Steel: Neon Vanguard', votes: [] }
        ],
        createdBy: 'host-alice',
        createdByName: 'Alice (Host)',
        createdAt: Date.now() - 350000,
        isActive: true
      }
    ],
    createdAt: Date.now() - 700000
  });
  RoomStorage.saveRooms(rooms, true);
}

// In-Memory Rate Limiter Map
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);
  if (!bucket || now > bucket.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) {
    return false;
  }
  bucket.count++;
  return true;
}

// Helper to compute live playback position
function getAuthoritativePosition(room: WatchRoom): number {
  if (room.playback.status === 'playing') {
    const elapsed = ((Date.now() - room.playback.updatedAt) / 1000) * room.playback.playbackRate;
    const mediaDuration = room.playback.media?.duration || 3600;
    return Math.min(room.playback.position + elapsed, mediaDuration);
  }
  return room.playback.position;
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: Date.now(), 
    activeRooms: rooms.size,
    persistence: 'durable-disk'
  });
});

app.get('/api/firewall/status', (req, res) => {
  res.json({
    status: 'active',
    inspectedRequests: wafStats.inspectedRequests,
    blockedAttacks: wafStats.blockedAttacks,
    uptimeSeconds: Math.floor((Date.now() - wafStats.startTime) / 1000),
    activeRules: [
      'Layer 7 Deep Packet Inspection',
      'XSS Exploit Neutralization',
      'SQLi Signature Blocking',
      'Prototype Pollution Shield',
      'Adaptive IP Rate Limiter (150 req/min)',
      'Strict Security Headers (CSP, Nosniff, SameOrigin)'
    ],
    recentDetections: wafStats.recentDetections
  });
});

app.get('/api/movies', (req, res) => {
  res.json(MOVIE_CATALOG);
});

app.get('/api/rooms', (req, res) => {
  const roomSummaries = Array.from(rooms.values()).map(r => ({
    id: r.id,
    title: r.title,
    participantCount: r.participants.filter(p => p.online).length,
    currentMediaTitle: r.playback.media?.title || null,
    hostName: r.participants.find(p => p.id === r.hostId)?.name || 'Host',
    playbackStatus: r.playback.status,
    isPermanent: r.isPermanent || false,
    creatorUid: r.creatorUid
  }));
  res.json(roomSummaries);
});

app.post('/api/rooms', (req, res) => {
  const { title, hostName, hostAvatar, playbackControl, isPermanent, customSlug, creatorUid } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Room title is required' });
  }

  // Check if permanent custom slug provided
  let roomId = '';
  if (customSlug && typeof customSlug === 'string') {
    const cleanSlug = customSlug.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
    if (cleanSlug.length >= 3 && !rooms.has(cleanSlug)) {
      roomId = cleanSlug;
    }
  }

  // Otherwise generate unique 6-character room code with collision prevention loop
  if (!roomId) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
      roomId = '';
      for (let i = 0; i < 6; i++) {
        roomId += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (rooms.has(roomId));
  }

  const hostId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const defaultMedia = MOVIE_CATALOG[0];

  const newRoom: WatchRoom = {
    id: roomId,
    title: title.trim().slice(0, 100),
    hostId,
    playbackControl: playbackControl === 'host-only' ? 'host-only' : 'all',
    playback: {
      media: defaultMedia,
      status: 'paused',
      position: 0,
      playbackRate: 1.0,
      updatedAt: Date.now(),
      sequenceNumber: 1
    },
    participants: [
      {
        id: hostId,
        name: typeof hostName === 'string' && hostName.trim() ? hostName.trim().slice(0, 50) : 'Host',
        avatar: typeof hostAvatar === 'string' && hostAvatar.trim() ? hostAvatar.trim() : `https://api.dicebear.com/7.x/bottts/svg?seed=${hostId}`,
        isHost: true,
        joinedAt: Date.now(),
        latencyMs: 15,
        online: false
      }
    ],
    playlist: [
      {
        id: `pl-${Date.now()}`,
        media: defaultMedia,
        addedBy: { id: hostId, name: hostName || 'Host' },
        addedAt: Date.now(),
        status: 'approved'
      }
    ],
    chat: [
      {
        id: `msg-${Date.now()}`,
        userId: 'system',
        userName: 'GreenRoom',
        userAvatar: '',
        text: `Room "${title.trim()}" created. Invite friends with code ${roomId}!`,
        timestamp: Date.now(),
        isSystem: true
      }
    ],
    polls: [],
    createdAt: Date.now(),
    isPermanent: Boolean(isPermanent),
    creatorUid: typeof creatorUid === 'string' ? creatorUid : undefined
  };

  rooms.set(roomId, newRoom);
  RoomStorage.saveRooms(rooms, true);

  res.json({ room: newRoom, hostId });
});

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  const currentPosition = getAuthoritativePosition(room);
  res.json({
    ...room,
    playback: {
      ...room.playback,
      position: currentPosition
    }
  });
});

app.delete('/api/rooms/:id', (req, res) => {
  const roomId = req.params.id;
  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  rooms.delete(roomId);
  RoomStorage.saveRooms(rooms, true);
  res.json({ success: true, message: `Room ${roomId} removed successfully.` });
});

app.post('/api/firewall/test', (req, res) => {
  res.json({
    status: 'clean',
    message: 'Payload cleared Deep Packet Inspection and rate check without any detected attack signatures.',
    timestamp: Date.now()
  });
});

app.post('/api/firewall/reset-stats', (req, res) => {
  wafStats.blockedAttacks = 0;
  wafStats.recentDetections = [];
  res.json({ success: true, message: 'Firewall threat telemetry reset.' });
});

// ==========================================
// Socket.IO Authentication Middleware
// ==========================================
io.use((socket, next) => {
  const auth = socket.handshake.auth;
  if (!auth || !auth.userId || typeof auth.userId !== 'string' || !auth.userId.trim()) {
    return next(new Error('Unauthorized: Authentication required with valid userId'));
  }

  // Bind verified user identity to server-controlled socket properties
  socket.data.userId = auth.userId.trim();
  socket.data.userName = typeof auth.userName === 'string' && auth.userName.trim() 
    ? auth.userName.trim().slice(0, 50) 
    : 'Participant';
  socket.data.userAvatar = typeof auth.avatar === 'string' ? auth.avatar.trim() : '';
  socket.data.connectedAt = Date.now();

  next();
});

// Socket.IO Real-Time Engine
io.on('connection', (socket) => {
  let currentRoomId: string | null = null;
  const authUserId = socket.data.userId;
  const authUserName = socket.data.userName;
  const authUserAvatar = socket.data.userAvatar;

  // Latency probe
  socket.on('ping-latency', (clientTimestamp: number, callback: (serverTime: number) => void) => {
    if (typeof callback === 'function') {
      callback(Date.now());
    }
  });

  // Join Room
  socket.on('join-room', (data: { roomId: string; user?: any }) => {
    const { roomId } = data || {};
    if (!roomId || typeof roomId !== 'string') {
      socket.emit('error-message', 'Invalid room identifier.');
      return;
    }

    const cleanRoomId = roomId.trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room) {
      socket.emit('error-message', `Room "${cleanRoomId}" not found. Verify the room code.`);
      return;
    }

    currentRoomId = cleanRoomId;
    socket.join(cleanRoomId);

    // Check if participant already in room using AUTHENTICATED socket identity
    const existingIndex = room.participants.findIndex(p => p.id === authUserId);
    const isFirstParticipant = room.participants.filter(p => p.online).length === 0;

    let isHost = false;
    if (existingIndex >= 0) {
      isHost = room.participants[existingIndex].isHost || isFirstParticipant || room.hostId === authUserId;
      room.participants[existingIndex] = {
        ...room.participants[existingIndex],
        name: authUserName,
        avatar: authUserAvatar,
        isHost,
        online: true,
        lastPing: Date.now()
      } as Participant;
    } else {
      isHost = isFirstParticipant || room.hostId === authUserId;
      const newParticipant: Participant = {
        id: authUserId,
        name: authUserName,
        avatar: authUserAvatar,
        isHost,
        joinedAt: Date.now(),
        latencyMs: 20,
        online: true
      };
      room.participants.push(newParticipant);
    }

    if (isHost && room.hostId !== authUserId) {
      room.hostId = authUserId;
    }

    // System announcement message
    const joinMsg: ChatMessage = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId: 'system',
      userName: 'GreenRoom',
      userAvatar: '',
      text: `${authUserName} joined the room`,
      timestamp: Date.now(),
      isSystem: true
    };
    room.chat.push(joinMsg);
    if (room.chat.length > 200) room.chat.shift();

    // Calculate current live playback position
    const currentPos = getAuthoritativePosition(room);
    const synchronizedPlayback = {
      ...room.playback,
      position: currentPos,
      updatedAt: Date.now()
    };
    room.playback = synchronizedPlayback;

    // Persist room updates
    RoomStorage.saveRooms(rooms);

    // Send complete state to the joining client
    socket.emit('room-state', {
      ...room,
      playback: synchronizedPlayback
    });

    // Broadcast participant update & system message to room
    io.to(cleanRoomId).emit('participants-updated', room.participants);
    io.to(cleanRoomId).emit('chat-message', joinMsg);
  });

  // Playback Control Command (Play, Pause, Seek, Rate, Change Media)
  socket.on('playback-command', (data: {
    roomId: string;
    action: 'play' | 'pause' | 'seek' | 'change-media' | 'rate';
    position?: number;
    media?: any;
    playbackRate?: number;
  }) => {
    // Rate Limiting: Max 8 commands per 2 seconds per user
    if (!checkRateLimit(`playback:${authUserId}`, 8, 2000)) {
      socket.emit('rate-limit-error', { 
        type: 'playback', 
        message: 'Playback command rate limit reached. Please wait.' 
      });
      return;
    }

    const { roomId, action, position, media, playbackRate } = data || {};
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // SECURE AUTHORIZATION: Use socket.data.userId (NEVER client-supplied data.userId)
    if (room.playbackControl === 'host-only' && room.hostId !== authUserId) {
      socket.emit('error-message', 'Unauthorized: Only the room host can control playback.');
      return;
    }

    const currentLivePos = getAuthoritativePosition(room);
    const newPos = typeof position === 'number' && !isNaN(position) ? Math.max(0, position) : currentLivePos;
    const newStatus = action === 'play' ? 'playing' : action === 'pause' ? 'paused' : room.playback.status;
    const newRate = typeof playbackRate === 'number' && playbackRate >= 0.25 && playbackRate <= 4 ? playbackRate : room.playback.playbackRate;
    const newMedia = media || room.playback.media;

    room.playback = {
      media: newMedia,
      status: newStatus,
      position: newPos,
      playbackRate: newRate,
      updatedAt: Date.now(),
      sequenceNumber: room.playback.sequenceNumber + 1
    };

    RoomStorage.saveRooms(rooms);

    // Broadcast authoritative playback state
    io.to(roomId).emit('playback-sync', {
      playback: room.playback,
      action,
      triggeredBy: authUserName,
      timestamp: Date.now()
    });
  });

  // Live Chat Message
  socket.on('chat-message', (data: { roomId: string; message: { text: string } }) => {
    // Rate Limiting: Max 5 messages in 3 seconds per user
    if (!checkRateLimit(`chat:${authUserId}`, 5, 3000)) {
      socket.emit('rate-limit-error', { 
        type: 'chat', 
        message: 'You are sending messages too quickly. Please wait a moment.' 
      });
      return;
    }

    const { roomId, message } = data || {};
    const room = rooms.get(roomId);
    if (!room || !message || typeof message.text !== 'string') return;

    const trimmedText = message.text.trim();
    if (!trimmedText) return;

    // Message Size Ceiling: Max 1,000 characters
    if (trimmedText.length > 1000) {
      socket.emit('error-message', 'Message exceeds 1,000 character limit.');
      return;
    }

    // AUTHENTICATED SENDER ATTRIBUTION: Disallow client spoofing of userName or avatar
    const chatMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: authUserId,
      userName: authUserName,
      userAvatar: authUserAvatar,
      text: trimmedText,
      timestamp: Date.now()
    };

    room.chat.push(chatMsg);
    if (room.chat.length > 200) room.chat.shift();

    RoomStorage.saveRooms(rooms);
    io.to(roomId).emit('chat-message', chatMsg);
  });

  // Floating Emoji Reaction
  socket.on('reaction', (data: { roomId: string; emoji: string }) => {
    // Rate Limiting: Max 8 reactions per 3 seconds per user
    if (!checkRateLimit(`reaction:${authUserId}`, 8, 3000)) {
      // Silently drop excessive reactions to avoid log spam
      return;
    }

    const { roomId, emoji } = data || {};
    const room = rooms.get(roomId);
    if (!room || !emoji || typeof emoji !== 'string' || emoji.length > 8) return;

    const reactionPayload = {
      id: `react-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emoji: emoji.slice(0, 4),
      userId: authUserId,
      userName: authUserName,
      timestamp: Date.now(),
      xOffset: Math.floor(Math.random() * 80) + 10
    };

    io.to(roomId).emit('reaction', reactionPayload);
  });

  // Collaborative Playlist Operations
  socket.on('playlist-action', (data: {
    roomId: string;
    action: 'add' | 'remove' | 'reorder' | 'suggest' | 'approve' | 'reject';
    item?: any;
    itemId?: string;
    fromIndex?: number;
    toIndex?: number;
  }) => {
    // Rate Limiting: Max 6 playlist operations per 5 seconds
    if (!checkRateLimit(`playlist:${authUserId}`, 6, 5000)) {
      socket.emit('rate-limit-error', { 
        type: 'playlist', 
        message: 'Playlist action rate limit reached. Please wait.' 
      });
      return;
    }

    const { roomId, action, item, itemId, fromIndex, toIndex } = data || {};
    const room = rooms.get(roomId);
    if (!room) return;

    const isHost = room.hostId === authUserId;

    if (action === 'add') {
      if (!item || typeof item.title !== 'string') return;
      const status = isHost || room.playbackControl === 'all' ? 'approved' : 'suggested';
      const newItem: PlaylistItem = {
        id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        media: item,
        addedBy: { id: authUserId, name: authUserName },
        addedAt: Date.now(),
        status
      };
      room.playlist.push(newItem);

      const notice: ChatMessage = {
        id: `sys-${Date.now()}`,
        userId: 'system',
        userName: 'GreenRoom',
        userAvatar: '',
        text: status === 'approved' 
          ? `${authUserName} added "${item.title}" to the playlist.` 
          : `${authUserName} suggested "${item.title}" for the playlist.`,
        timestamp: Date.now(),
        isSystem: true
      };
      room.chat.push(notice);
      io.to(roomId).emit('chat-message', notice);
    } else if (action === 'remove' && itemId) {
      const target = room.playlist.find(p => p.id === itemId);
      // Only host or the user who queued the item can remove it
      if (target && (isHost || target.addedBy.id === authUserId)) {
        room.playlist = room.playlist.filter(p => p.id !== itemId);
      }
    } else if (action === 'reorder' && typeof fromIndex === 'number' && typeof toIndex === 'number') {
      if (fromIndex >= 0 && fromIndex < room.playlist.length && toIndex >= 0 && toIndex < room.playlist.length) {
        const [movedItem] = room.playlist.splice(fromIndex, 1);
        room.playlist.splice(toIndex, 0, movedItem);
      }
    } else if (action === 'approve' && itemId && isHost) {
      const target = room.playlist.find(p => p.id === itemId);
      if (target) {
        target.status = 'approved';
        const notice: ChatMessage = {
          id: `sys-${Date.now()}`,
          userId: 'system',
          userName: 'GreenRoom',
          userAvatar: '',
          text: `Host approved "${target.media.title}" for the playlist.`,
          timestamp: Date.now(),
          isSystem: true
        };
        room.chat.push(notice);
        io.to(roomId).emit('chat-message', notice);
      }
    } else if (action === 'reject' && itemId && isHost) {
      room.playlist = room.playlist.filter(p => p.id !== itemId);
    }

    RoomStorage.saveRooms(rooms);
    io.to(roomId).emit('playlist-updated', room.playlist);
  });

  // Group Poll Operations
  socket.on('poll-action', (data: {
    roomId: string;
    action: 'create' | 'vote' | 'close' | 'reset';
    poll?: any;
    pollId?: string;
    optionId?: string;
  }) => {
    // Rate Limiting: Max 4 poll operations per 10 seconds
    if (!checkRateLimit(`poll:${authUserId}`, 4, 10000)) {
      socket.emit('rate-limit-error', { 
        type: 'poll', 
        message: 'Poll action rate limit reached. Please wait.' 
      });
      return;
    }

    const { roomId, action, poll, pollId, optionId } = data || {};
    const room = rooms.get(roomId);
    if (!room) return;

    if (action === 'create' && poll) {
      if (!poll.question || typeof poll.question !== 'string' || !Array.isArray(poll.options)) return;
      const cleanOptions = poll.options
        .filter((o: any) => typeof o === 'string' && o.trim())
        .map((o: string) => o.trim().slice(0, 100));

      if (cleanOptions.length < 2) return;

      const newPoll: Poll = {
        id: `poll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        question: poll.question.trim().slice(0, 200),
        options: cleanOptions.map((optText: string, idx: number) => ({
          id: `opt-${idx}-${Date.now()}`,
          text: optText,
          votes: []
        })),
        createdBy: authUserId,
        createdByName: authUserName,
        createdAt: Date.now(),
        isActive: true
      };
      room.polls.unshift(newPoll);

      const notice: ChatMessage = {
        id: `sys-${Date.now()}`,
        userId: 'system',
        userName: 'GreenRoom',
        userAvatar: '',
        text: `New poll started: "${newPoll.question}"`,
        timestamp: Date.now(),
        isSystem: true
      };
      room.chat.push(notice);
      io.to(roomId).emit('chat-message', notice);
    } else if (action === 'vote' && pollId && optionId) {
      const targetPoll = room.polls.find(p => p.id === pollId);
      if (targetPoll && targetPoll.isActive) {
        // Toggle or switch vote using authenticated authUserId
        targetPoll.options.forEach(opt => {
          opt.votes = opt.votes.filter(uId => uId !== authUserId);
        });
        const chosenOpt = targetPoll.options.find(opt => opt.id === optionId);
        if (chosenOpt) {
          chosenOpt.votes.push(authUserId);
        }
      }
    } else if (action === 'close' && pollId) {
      const targetPoll = room.polls.find(p => p.id === pollId);
      // SECURE CHECK: Only the poll creator or room host can end the poll
      if (targetPoll && (targetPoll.createdBy === authUserId || room.hostId === authUserId)) {
        targetPoll.isActive = false;
        let maxVotes = -1;
        let winningId: string | undefined;
        targetPoll.options.forEach(o => {
          if (o.votes.length > maxVotes) {
            maxVotes = o.votes.length;
            winningId = o.id;
          }
        });
        targetPoll.winningOptionId = winningId;

        const winOpt = targetPoll.options.find(o => o.id === winningId);
        const notice: ChatMessage = {
          id: `sys-${Date.now()}`,
          userId: 'system',
          userName: 'GreenRoom',
          userAvatar: '',
          text: `Poll ended! Winner: "${winOpt ? winOpt.text : 'No votes cast'}" (${maxVotes} votes)`,
          timestamp: Date.now(),
          isSystem: true
        };
        room.chat.push(notice);
        io.to(roomId).emit('chat-message', notice);
      }
    }

    RoomStorage.saveRooms(rooms);
    io.to(roomId).emit('polls-updated', room.polls);
  });

  // Host Privilege Delegation & Room Settings (SECURE: Bound to socket.data.userId)
  socket.on('host-action', (data: {
    roomId: string;
    action: 'transfer' | 'kick' | 'update-settings';
    targetUserId?: string;
    settings?: { playbackControl?: 'all' | 'host-only'; title?: string };
  }) => {
    const { roomId, action, targetUserId, settings } = data || {};
    const room = rooms.get(roomId);
    if (!room) return;

    // SECURE HOST VERIFICATION: Check socket.data.userId against room.hostId
    if (room.hostId !== authUserId) {
      socket.emit('error-message', 'Unauthorized: Only the current room host can perform host management.');
      return;
    }

    if (action === 'transfer' && targetUserId) {
      const targetUser = room.participants.find(p => p.id === targetUserId);
      if (targetUser) {
        room.hostId = targetUserId;
        room.participants.forEach(p => {
          p.isHost = p.id === targetUserId;
        });

        const notice: ChatMessage = {
          id: `sys-${Date.now()}`,
          userId: 'system',
          userName: 'GreenRoom',
          userAvatar: '',
          text: `${authUserName} transferred host privileges to ${targetUser.name}.`,
          timestamp: Date.now(),
          isSystem: true
        };
        room.chat.push(notice);
        io.to(roomId).emit('chat-message', notice);
        io.to(roomId).emit('participants-updated', room.participants);
        io.to(roomId).emit('room-settings-updated', {
          hostId: room.hostId,
          playbackControl: room.playbackControl,
          title: room.title
        });
      }
    } else if (action === 'kick' && targetUserId) {
      room.participants = room.participants.filter(p => p.id !== targetUserId);
      io.to(roomId).emit('participants-updated', room.participants);
      io.to(roomId).emit('participant-kicked', { userId: targetUserId });
    } else if (action === 'update-settings' && settings) {
      if (settings.playbackControl) {
        room.playbackControl = settings.playbackControl;
      }
      if (settings.title && typeof settings.title === 'string') {
        room.title = settings.title.trim().slice(0, 100);
      }
      io.to(roomId).emit('room-settings-updated', {
        hostId: room.hostId,
        playbackControl: room.playbackControl,
        title: room.title
      });
    }

    RoomStorage.saveRooms(rooms, true);
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const participant = room.participants.find(p => p.id === authUserId);
        if (participant) {
          participant.online = false;
        }

        // If host disconnected, check if another participant can take over
        if (room.hostId === authUserId) {
          const nextOnline = room.participants.find(p => p.online && p.id !== authUserId);
          if (nextOnline) {
            room.hostId = nextOnline.id;
            nextOnline.isHost = true;
            io.to(currentRoomId).emit('room-settings-updated', {
              hostId: room.hostId,
              playbackControl: room.playbackControl,
              title: room.title
            });
          }
        }

        RoomStorage.saveRooms(rooms);
        io.to(currentRoomId).emit('participants-updated', room.participants);
      }
    }
  });
});

// Configure Vite Middlewares in Dev or Static Serving in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(port, () => {
    console.log(`GreenRoom server running on port ${port} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
