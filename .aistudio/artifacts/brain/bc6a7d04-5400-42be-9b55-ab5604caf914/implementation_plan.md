# GreenRoom — Watch Together: Implementation Plan

GreenRoom is a real-time, multi-user watch party platform featuring server-authoritative synchronized video playback, live chat and emoji reactions, collaborative room playlists, group voting polls, and an authentic curated movie discovery catalog, styled with a modern soft mint and natural green aesthetic.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following design and product directions were confirmed via interactive clarification:
> - **Video Playback Source**: Curated open-access cinema library (classic cinema, high-definition documentaries, open-license film shorts, and animations with subtitles) plus custom user MP4/WebM direct streaming URLs.
> - **Movie Discovery Engine**: Built-in rich cinema catalog with genre tags, release years, synopses, cast info, video previews, and resilient fuzzy search.
> - **Multi-Client Verification**: Built-in interactive Multi-Client Simulator & Latency Tester allowing live verification of 10+ concurrent participants, drift measurement, and sub-250ms propagation across simulated peers right in the browser.

---

## 1. Overview & Core Concept

- **What It Does**: Enables friends, family, and communities to gather in synchronized virtual screening rooms. Video play/pause, seek positions, and playback rates stay lockstepped across all participants with automatic drift correction under 500ms.
- **Target Audience**: Film lovers, remote study groups, streaming clubs, and watch party organizers who want a clutter-free, privacy-conscious shared viewing experience.
- **Key Value**: Low-latency server-authoritative synchronization without third-party paywalls or account gates, paired with collaborative tools (chat, polls, shared queue, host delegation).

---

## 2. User Experience & Visual Design

### Visual Identity & Theme
- **Color Discipline**:
  - *Primary Leaf Accent*: `#4C956C` (Primary actions, playback scrubbers, active states)
  - *Secondary Pale Mint*: `#DDF3E4` (Subtle selection highlights, pill-free active indicator backings)
  - *Muted Soft Green*: `#A8D5BA` (Badges, accents, secondary toggles)
  - *Main Canvas Background*: `#F8FAF6` (Warm off-white)
  - *Card & Panel Surface*: `#FFFFFF` with hairline pale green borders (`#E1EBE2`)
  - *Primary Typography*: `#20382B` (Dark forest green for high contrast readability)
  - *Muted Typography*: `#6B7C70` (Secondary metadata, timestamps, unboxed tags)
- **Zero-Pill Discipline**:
  - Metadata (genres, runtimes, participant counts, timestamps) rendered as clean unboxed text separated by typographic middots (`·`).
  - Strict absence of decorative pulsing dots, fake AI scorecards, or pseudo-code commentary.
- **Top Bar & Navigation Contract**:
  - Desktop: Dedicated left sidebar navigation with 5 key views: **Dashboard**, **Watch Room**, **Discover**, **Playlists**, and **Profile & Settings**, plus quick "Create Room" / "Join Room" triggers.
  - Room Topbar: Clean breadcrumbs, live room ID with 1-click invite link copying, active participant counter, and host badge.

### Key User Flows

1. **Room Creation & Onboarding**:
   - User creates room with a friendly title (e.g., "Friday Sci-Fi Night") or joins via a 6-character room code or shared URL.
   - User sets display name and picks an avatar, with host role automatically assigned to the room creator.

2. **Synchronized Playback Experience**:
   - Host selects video from the curated catalog or pastes a direct MP4/WebM URL.
   - Synchronized player provides custom controls (play/pause, seek ±10s, scrubber, volume, theater/fullscreen mode, playback rate).
   - Late-joining participants immediately receive the server's authoritative timestamp and start playing in sync.
   - Built-in drift compensator checks local `currentTime` against server `(lastTimestamp + elapsed)` every 2 seconds; if drift exceeds 500ms, it smoothly rate-adjusts or snaps.

3. **Live Social Interactions**:
   - **Chat**: Instant messaging with auto-scroll lock, message timestamps, sender badges, and Enter/Shift+Enter support.
   - **Floating Reactions**: Quick-tap emoji bursts (😂, ❤️, 😮, 🔥, 👏) floating tastefully over the corner of the room without obstructing captions.
   - **Collaborative Playlists**: Queue videos, vote/suggest next tracks, reorder with up/down controls, and auto-advance on video end.
   - **Group Polls**: Host or guests create polls ("Which movie next?"), participants cast votes, and winning results reveal in real time.

4. **Movie Discovery & Recommendations**:
   - Filter by genre (Sci-Fi, Classic, Documentary, Animation, Drama, Comedy).
   - Fast fuzzy search matching titles, cast, and directors.
   - One-click "Add to Room Playlist" or "Watch Now".

5. **Multi-User Latency & Drift Inspector**:
   - Interactive panel allowing the tester to spin up 3–10 simulated client bots with configurable simulated latency (20ms, 80ms, 200ms) to measure and record real-time drift, p95 control latency, and broadcast performance.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express + Socket.IO Server on Port 3000**
  - *Chosen Approach*: Integrate an Express HTTP server with a Socket.IO WebSocket server mounted on the same port 3000 alongside Vite's development handler or static bundle.
  - *Why*: Provides true real-time bidirectional communication, room clustering, reconnection heartbeats, and millisecond-level broadcast propagation.
  - *Alternatives Considered*: Server-Sent Events (SSE) + HTTP POST (one-way only, higher latency) or purely client-side BroadcastChannel (fails across separate machines/devices).

- **Decision 2: Server-Authoritative Playback State Engine**
  - *Chosen Approach*: The server maintains `{ currentMedia, status: 'playing'|'paused', position: number, playbackRate: 1.0, updatedAt: number, version: number }`.
  - *Why*: Eliminates race conditions when multiple users click pause/play simultaneously. The server resolves the winning timestamp and broadcasts the authoritative state.

- **Decision 3: Curated High-Definition Public Domain & Creative Commons Media**
  - *Chosen Approach*: Pre-loaded library of public-domain classics (e.g., *Charade*, *Night of the Living Dead*, *His Girl Friday*, *Sita Sings the Blues*, NASA 4K archives, open Blender shorts *Big Buck Bunny* / *Cosmos Laundromat*) hosted on fast reliable CDNs, coupled with custom URL input.
  - *Why*: Complies with copyright restrictions and ensures 100% playable, seekable, glitch-free video streaming across all browsers without DRM blocks.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Browser Client (React 19)                       │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │   WatchRoomView       │  │ DiscoverView    │  │  PlaylistsView   │  │
│  │ - HTML5 Video Player  │  │ - Fuzzy Search  │  │ - Shared Queue   │  │
│  │ - Drift Compensator   │  │ - Category Tabs │  │ - Suggest/Approve│  │
│  │ - Chat & Reactions    │  │ - Movie Modals  │  │ - Reorder Items  │  │
│  └───────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘  │
│              │                       │                    │            │
│  ┌───────────┴───────────────────────┴────────────────────┴─────────┐  │
│  │                   SocketContext & RoomStateManager                │  │
│  │   - Socket.IO Client connection with exponential retry            │  │
│  │   - Drift reconciliation loop (< 500ms target)                    │  │
│  │   - Latency probe & metrics recorder (p95 calculations)           │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │ WebSocket (Port 3000)
┌──────────────────────────────────────┴─────────────────────────────────┐
│                    Full-Stack Node.js / Express Server                 │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Room State Manager   │  │  Sync Engine    │  │ REST API         │  │
│  │  - Active Rooms & Host│  │  - Drift Check  │  │ - Movie Catalog  │  │
│  │  - Participant list   │  │  - Timestamp Clc│  │ - Room Meta      │  │
│  │  - Chat history (100) │  │  - Broadcast p95│  │ - Health Check   │  │
│  │  - Poll state & votes │  │    dispatch     │  │                  │  │
│  └───────────────────────┘  └─────────────────┘  └──────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                In-Memory + File-Backed Store                      │  │
│  │  - Rooms, Playlists, Catalog, Profiles                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Structures

- **Room**:
  ```ts
  interface WatchRoom {
    id: string;
    title: string;
    hostId: string;
    playbackControl: 'host-only' | 'all';
    playback: {
      media: MediaItem | null;
      status: 'playing' | 'paused';
      position: number; // in seconds
      playbackRate: number;
      updatedAt: number; // server epoch ms
      sequenceNumber: number;
    };
    participants: Participant[];
    playlist: PlaylistItem[];
    chat: ChatMessage[];
    polls: Poll[];
  }
  ```

- **Participant**:
  ```ts
  interface Participant {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    joinedAt: number;
    lastPing: number;
    latencyMs: number;
  }
  ```

### Drift Correction Algorithm

```ts
// Executed on client playback tick every 2000ms:
const now = Date.now();
const serverElapsed = room.playback.status === 'playing' 
  ? (now - room.playback.updatedAt) / 1000 * room.playback.playbackRate 
  : 0;
const expectedTime = room.playback.position + serverElapsed;
const drift = Math.abs(videoElement.currentTime - expectedTime);

if (drift > 1.5) {
  // Hard seek for large desync (> 1.5s)
  videoElement.currentTime = expectedTime;
} else if (drift > 0.5) {
  // Micro-adjustment via playbackRate (0.95x or 1.05x) to eliminate seek stutter
  videoElement.playbackRate = videoElement.currentTime < expectedTime ? 1.05 : 0.95;
} else {
  videoElement.playbackRate = room.playback.playbackRate;
}
```

---

## 5. Implementation Steps (Turn 3 Execution)

1. **Install Socket.io Dependencies**: Add `socket.io` and `socket.io-client` via `install_applet_package`.
2. **Server-Side Full-Stack Architecture**:
   - Create `server.ts` with Express and Socket.IO server handling room lifecycle, participant management, authoritative playback mutations, chat, polls, and playlist syncing.
   - Configure Vite middleware for dev mode and static serving for production builds.
3. **Data Layer & Media Catalog**:
   - Create `src/data/movieCatalog.ts` with authentic movie data (classics, documentaries, sci-fi open releases) with poster art, descriptions, runtimes, cast, and high-speed streaming links.
4. **State Management & Socket Hooks**:
   - Implement `src/context/RoomContext.tsx` handling connection lifecycle, optimistic updates, drift calculations, and reconnect backoff.
5. **UI & Components Implementation (Mint & Leaf Palette)**:
   - Sidebar navigation & header contract.
   - Dashboard page (active rooms, quick join, recent rooms).
   - Watch Room page with custom HTML5 synchronized player, participant roster, chat panel, reaction layer, collaborative queue, and poll card.
   - Movie Discovery page with category filters, fuzzy search, and quick queue buttons.
   - Playlists view with drag/order controls and suggestion approvals.
   - Interactive Multi-Client Testing Modal to simulate 10 concurrent peers and benchmark p95 latency.
6. **Compile & Verification**: Run `compile_applet` and verify no TypeScript or styling errors.
