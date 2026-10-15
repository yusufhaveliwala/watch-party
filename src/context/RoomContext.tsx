import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  WatchRoom, 
  Participant, 
  MediaItem, 
  ChatMessage, 
  EmojiReaction, 
  Poll, 
  PlaylistItem,
  RoomSummary 
} from '../types/watchParty';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  handleFirestoreError,
  OperationType,
  serverTimestamp
} from '../firebase';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  isGoogleUser?: boolean;
}

interface RoomContextType {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  updateUserProfile: (name: string, avatar: string) => void;
  firebaseUser: User | null;
  isAuthReady: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  room: WatchRoom | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  latencyMs: number;
  p95Latency: number;
  currentDriftMs: number;
  driftCorrectionsCount: number;
  activeReactions: EmojiReaction[];
  errorMessage: string | null;
  clearError: () => void;
  joinRoom: (roomId: string) => void;
  createRoom: (
    title: string, 
    playbackControl?: 'all' | 'host-only',
    isPermanent?: boolean,
    customSlug?: string
  ) => Promise<string>;
  leaveRoom: () => void;
  deletePermanentRoom: (roomId: string) => Promise<void>;
  savedPermanentRoomIds: string[];
  toggleSavePermanentRoom: (roomId: string) => Promise<void>;
  permanentRoomsList: WatchRoom[];
  refreshRooms: () => Promise<void>;
  sendPlaybackCommand: (
    action: 'play' | 'pause' | 'seek' | 'change-media' | 'rate',
    options?: { position?: number; media?: MediaItem; playbackRate?: number }
  ) => void;
  sendChatMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  sendPlaylistAction: (
    action: 'add' | 'remove' | 'reorder' | 'suggest' | 'approve' | 'reject',
    data?: { item?: MediaItem; itemId?: string; fromIndex?: number; toIndex?: number }
  ) => void;
  sendPollAction: (
    action: 'create' | 'vote' | 'close' | 'reset',
    data?: { poll?: { question: string; options: string[] }; pollId?: string; optionId?: string }
  ) => void;
  sendHostAction: (
    action: 'transfer' | 'kick' | 'update-settings',
    data?: { targetUserId?: string; settings?: { playbackControl?: 'all' | 'host-only'; title?: string } }
  ) => void;
  isHost: boolean;
  canControlPlayback: boolean;
}

const RoomContext = createContext<RoomContextType | null>(null);

function getInitialUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem('greenroom_user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore
  }
  const randomNum = Math.floor(100 + Math.random() * 900);
  const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const names = ['Fern', 'Sage', 'Rowan', 'Cedar', 'Willow', 'Jasper', 'Flora', 'Moss', 'Laurel', 'Breeze'];
  const name = `${names[Math.floor(Math.random() * names.length)]}_${randomNum}`;
  const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
  const profile: UserProfile = { id, name, avatar, isGoogleUser: false };
  try {
    localStorage.setItem('greenroom_user', JSON.stringify(profile));
  } catch {
    // Ignore
  }
  return profile;
}

function getInitialSavedRooms(): string[] {
  try {
    const saved = localStorage.getItem('greenroom_saved_rooms');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore
  }
  return ['CINEMA-1'];
}

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile>(getInitialUserProfile);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [p95Latency, setP95Latency] = useState<number>(0);
  const [currentDriftMs, setCurrentDriftMs] = useState<number>(0);
  const [driftCorrectionsCount, setDriftCorrectionsCount] = useState<number>(0);
  const [activeReactions, setActiveReactions] = useState<EmojiReaction[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedPermanentRoomIds, setSavedPermanentRoomIds] = useState<string[]>(getInitialSavedRooms);
  const [permanentRoomsList, setPermanentRoomsList] = useState<WatchRoom[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const setUser = useCallback((newProfile: UserProfile) => {
    setUserState(newProfile);
    try {
      localStorage.setItem('greenroom_user', JSON.stringify(newProfile));
    } catch {
      // Ignore
    }
  }, []);

  const updateUserProfile = useCallback((name: string, avatar: string) => {
    setUserState(prev => {
      const updated = { ...prev, name, avatar };
      try {
        localStorage.setItem('greenroom_user', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const clearError = () => setErrorMessage(null);

  // Sync rooms list from backend
  const refreshRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data: RoomSummary[] = await res.json();
        // Convert permanent summaries into room objects or fetch detail if needed
        const permanentSummaries = data.filter(r => r.isPermanent);
        // Also fetch active rooms to know details
        setPermanentRoomsList(prev => {
          // Keep existing detailed objects if matching id
          return permanentSummaries.map(summary => {
            const existing = prev.find(p => p.id === summary.id);
            if (existing) {
              return {
                ...existing,
                title: summary.title,
                isPermanent: true,
                creatorUid: summary.creatorUid
              };
            }
            return {
              id: summary.id,
              title: summary.title,
              hostId: '',
              playbackControl: 'all',
              playback: {
                media: null,
                status: summary.playbackStatus,
                position: 0,
                playbackRate: 1.0,
                updatedAt: Date.now(),
                sequenceNumber: 1
              },
              participants: [],
              playlist: [],
              chat: [],
              polls: [],
              createdAt: Date.now(),
              isPermanent: true,
              creatorUid: summary.creatorUid
            };
          });
        });
      }
    } catch {
      // Ignore network errors in polling
    }
  }, []);

  // Firebase Auth Listener & Firestore Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      setIsAuthReady(true);

      if (currentUser) {
        // Logged in with Google
        const googleProfile: UserProfile = {
          id: currentUser.uid,
          name: currentUser.displayName || 'Google Member',
          avatar: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
          email: currentUser.email || undefined,
          isGoogleUser: true
        };
        setUser(googleProfile);

        // Fetch or create user record in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            await setDoc(userDocRef, {
              userId: currentUser.uid,
              displayName: currentUser.displayName || 'Google Member',
              email: currentUser.email || '',
              avatar: currentUser.photoURL || googleProfile.avatar,
              permanentRoomIds: savedPermanentRoomIds,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } else {
            const data = userSnap.data();
            if (Array.isArray(data.permanentRoomIds)) {
              setSavedPermanentRoomIds(prev => Array.from(new Set([...prev, ...data.permanentRoomIds])));
            }
          }
        } catch (err) {
          console.warn('[Firebase] Firestore user sync note:', err);
        }
      } else {
        // Signed out
        setUserState(prev => ({
          ...prev,
          isGoogleUser: false,
          email: undefined
        }));
      }
    });

    return () => unsubscribeAuth();
  }, [setUser, savedPermanentRoomIds]);

  // Real-time Firestore Permanent Rooms listener
  useEffect(() => {
    refreshRooms();
    const roomsColRef = collection(db, 'rooms');
    const unsub = onSnapshot(roomsColRef, (snapshot) => {
      const firestoreRooms: WatchRoom[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (d && d.id) {
          firestoreRooms.push({
            id: d.id,
            title: d.title || 'Permanent Room',
            hostId: d.creatorUid || '',
            playbackControl: d.playbackControl || 'all',
            playback: d.playback || {
              media: null,
              status: 'paused',
              position: 0,
              playbackRate: 1.0,
              updatedAt: Date.now(),
              sequenceNumber: 1
            },
            participants: [],
            playlist: d.playlist || [],
            chat: [],
            polls: [],
            createdAt: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
            isPermanent: true,
            creatorUid: d.creatorUid
          });
        }
      });
      if (firestoreRooms.length > 0) {
        setPermanentRoomsList(firestoreRooms);
      }
    }, (error) => {
      // Permission or offline handler conforming to skill
      console.warn('[Firestore] Rooms listener status:', error.message);
    });

    return () => unsub();
  }, [refreshRooms]);

  // Google Sign-In
  const loginWithGoogle = async () => {
    try {
      clearError();
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('[Auth] Google sign in error:', err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Google Sign-In popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // User closed popup, do not show fatal error
      } else {
        setErrorMessage(err.message || 'Google Sign-In could not be completed.');
      }
    }
  };

  // Google Sign-Out
  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error signing out.');
    }
  };

  // Initialize socket
  useEffect(() => {
    const socket = io({
      auth: {
        userId: user.id,
        userName: user.name,
        avatar: user.avatar
      },
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      if (currentRoomIdRef.current) {
        socket.emit('join-room', { roomId: currentRoomIdRef.current, user });
      }
    });

    socket.on('connecting', () => setConnectionStatus('connecting'));
    socket.on('reconnect_attempt', () => setConnectionStatus('reconnecting'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));

    socket.on('room-state', (roomData: WatchRoom) => {
      setRoom(roomData);
    });

    socket.on('playback-sync', ({ playback }: { playback: any; action: string; triggeredBy: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playback
        };
      });
    });

    socket.on('chat-message', (msg: ChatMessage) => {
      setRoom((prev) => {
        if (!prev) return prev;
        if (prev.chat.some(c => c.id === msg.id)) return prev;
        return {
          ...prev,
          chat: [...prev.chat, msg]
        };
      });
    });

    socket.on('reaction', (reaction: EmojiReaction) => {
      setActiveReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter(r => r.id !== reaction.id));
      }, 3200);
    });

    socket.on('participants-updated', (participants: Participant[]) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants
        };
      });
    });

    socket.on('playlist-updated', (playlist: PlaylistItem[]) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playlist
        };
      });
    });

    socket.on('polls-updated', (polls: Poll[]) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          polls
        };
      });
    });

    socket.on('room-settings-updated', (settings: any) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...settings
        };
      });
    });

    socket.on('error-message', (msg: string) => {
      setErrorMessage(msg);
    });

    socket.on('rate-limit-error', ({ message }: { message: string }) => {
      setErrorMessage(message || 'Rate limit reached. Please wait.');
    });

    // Latency Ping interval
    const pingTimer = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping-latency', start, () => {
          const rtt = Date.now() - start;
          const oneWayLatency = Math.round(rtt / 2);
          setLatencyMs(oneWayLatency);
          setLatencyHistory((hist) => {
            const next = [...hist.slice(-19), oneWayLatency];
            const sorted = [...next].sort((a, b) => a - b);
            const p95Idx = Math.floor(sorted.length * 0.95);
            setP95Latency(sorted[p95Idx] || sorted[sorted.length - 1] || oneWayLatency);
            return next;
          });
        });
      }
    }, 4000);

    return () => {
      clearInterval(pingTimer);
      socket.disconnect();
    };
  }, []);

  // Update socket auth when user changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.auth) {
      socketRef.current.auth = {
        userId: user.id,
        userName: user.name,
        avatar: user.avatar
      };
    }
  }, [user]);

  // Join Room
  const joinRoom = useCallback((roomId: string) => {
    if (!socketRef.current) return;
    const cleanId = roomId.trim().toUpperCase();
    currentRoomIdRef.current = cleanId;
    socketRef.current.emit('join-room', { roomId: cleanId, user });
  }, [user]);

  // Create Room (Supports permanent room, custom slug, and Firebase cloud sync)
  const createRoom = useCallback(async (
    title: string, 
    playbackControl: 'all' | 'host-only' = 'all',
    isPermanent: boolean = false,
    customSlug?: string
  ): Promise<string> => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          hostName: user.name,
          hostAvatar: user.avatar,
          playbackControl,
          isPermanent,
          customSlug: customSlug ? customSlug.trim() : undefined,
          creatorUid: firebaseUser ? firebaseUser.uid : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      const newRoomId = data.room.id;

      // If permanent room created, save to local persistent list
      if (isPermanent) {
        setSavedPermanentRoomIds(prev => {
          const updated = Array.from(new Set([...prev, newRoomId]));
          try {
            localStorage.setItem('greenroom_saved_rooms', JSON.stringify(updated));
          } catch {
            // Ignore
          }
          return updated;
        });

        // If authenticated with Google, sync permanent room to Firebase Firestore!
        if (firebaseUser) {
          try {
            const roomDocRef = doc(db, 'rooms', newRoomId);
            await setDoc(roomDocRef, {
              id: newRoomId,
              title: title.trim(),
              creatorUid: firebaseUser.uid,
              creatorName: firebaseUser.displayName || user.name,
              isPermanent: true,
              playbackControl,
              playback: {
                media: null,
                status: 'paused',
                position: 0,
                playbackRate: 1.0,
                updatedAt: Date.now(),
                sequenceNumber: 1
              },
              playlist: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            // Also link to user profile
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userDocRef, {
              permanentRoomIds: arrayUnion(newRoomId),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (fireError) {
            console.warn('[Firebase] Permanent room cloud sync warning:', fireError);
          }
        }
      }

      joinRoom(newRoomId);
      refreshRooms();
      return newRoomId;
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating watch room');
      throw err;
    }
  }, [user, firebaseUser, joinRoom, refreshRooms]);

  // Toggle Save/Bookmark Permanent Room
  const toggleSavePermanentRoom = useCallback(async (roomId: string) => {
    const isSaved = savedPermanentRoomIds.includes(roomId);
    const updated = isSaved 
      ? savedPermanentRoomIds.filter(id => id !== roomId)
      : [...savedPermanentRoomIds, roomId];
    
    setSavedPermanentRoomIds(updated);
    try {
      localStorage.setItem('greenroom_saved_rooms', JSON.stringify(updated));
    } catch {
      // Ignore
    }

    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          permanentRoomIds: isSaved ? arrayRemove(roomId) : arrayUnion(roomId),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('[Firebase] Error updating saved permanent room:', err);
      }
    }
  }, [savedPermanentRoomIds, firebaseUser]);

  // Delete Permanent Room
  const deletePermanentRoom = useCallback(async (roomId: string) => {
    try {
      await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      
      setSavedPermanentRoomIds(prev => {
        const updated = prev.filter(id => id !== roomId);
        try {
          localStorage.setItem('greenroom_saved_rooms', JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });

      if (firebaseUser) {
        try {
          await deleteDoc(doc(db, 'rooms', roomId));
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userDocRef, {
            permanentRoomIds: arrayRemove(roomId),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn('[Firebase] Error deleting Firestore permanent room:', err);
        }
      }

      refreshRooms();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete room');
    }
  }, [firebaseUser, refreshRooms]);

  // Leave Room
  const leaveRoom = useCallback(() => {
    if (socketRef.current && currentRoomIdRef.current) {
      currentRoomIdRef.current = null;
      setRoom(null);
    }
  }, []);

  // Playback Command
  const sendPlaybackCommand = useCallback((
    action: 'play' | 'pause' | 'seek' | 'change-media' | 'rate',
    options?: { position?: number; media?: MediaItem; playbackRate?: number }
  ) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('playback-command', {
      roomId: room.id,
      action,
      position: options?.position,
      media: options?.media,
      playbackRate: options?.playbackRate,
      userId: user.id,
      userName: user.name
    });
  }, [room, user]);

  // Chat message
  const sendChatMessage = useCallback((text: string) => {
    if (!socketRef.current || !room || !text.trim()) return;
    socketRef.current.emit('chat-message', {
      roomId: room.id,
      message: {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        text: text.trim()
      }
    });
  }, [room, user]);

  // Reaction
  const sendReaction = useCallback((emoji: string) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('reaction', {
      roomId: room.id,
      emoji,
      userId: user.id,
      userName: user.name
    });
  }, [room, user]);

  // Playlist actions
  const sendPlaylistAction = useCallback((
    action: 'add' | 'remove' | 'reorder' | 'suggest' | 'approve' | 'reject',
    data?: { item?: MediaItem; itemId?: string; fromIndex?: number; toIndex?: number }
  ) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('playlist-action', {
      roomId: room.id,
      action,
      item: data?.item,
      itemId: data?.itemId,
      fromIndex: data?.fromIndex,
      toIndex: data?.toIndex,
      userId: user.id,
      userName: user.name
    });
  }, [room, user]);

  // Poll actions
  const sendPollAction = useCallback((
    action: 'create' | 'vote' | 'close' | 'reset',
    data?: { poll?: { question: string; options: string[] }; pollId?: string; optionId?: string }
  ) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('poll-action', {
      roomId: room.id,
      action,
      poll: data?.poll,
      pollId: data?.pollId,
      optionId: data?.optionId,
      userId: user.id,
      userName: user.name
    });
  }, [room, user]);

  // Host actions
  const sendHostAction = useCallback((
    action: 'transfer' | 'kick' | 'update-settings',
    data?: { targetUserId?: string; settings?: { playbackControl?: 'all' | 'host-only'; title?: string } }
  ) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('host-action', {
      roomId: room.id,
      action,
      targetUserId: data?.targetUserId,
      settings: data?.settings,
      userId: user.id,
      userName: user.name
    });
  }, [room, user]);

  const isHost = Boolean(room && room.hostId === user.id);
  const canControlPlayback = Boolean(room && (room.playbackControl === 'all' || isHost));

  return (
    <RoomContext.Provider
      value={{
        user,
        setUser,
        updateUserProfile,
        firebaseUser,
        isAuthReady,
        loginWithGoogle,
        logout,
        room,
        connectionStatus,
        latencyMs,
        p95Latency,
        currentDriftMs,
        driftCorrectionsCount,
        activeReactions,
        errorMessage,
        clearError,
        joinRoom,
        createRoom,
        leaveRoom,
        deletePermanentRoom,
        savedPermanentRoomIds,
        toggleSavePermanentRoom,
        permanentRoomsList,
        refreshRooms,
        sendPlaybackCommand,
        sendChatMessage,
        sendReaction,
        sendPlaylistAction,
        sendPollAction,
        sendHostAction,
        isHost,
        canControlPlayback
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export function useRoom(): RoomContextType {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return ctx;
}
