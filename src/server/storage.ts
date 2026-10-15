import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WatchRoom } from '../types/watchParty';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORAGE_FILE = path.resolve(DATA_DIR, 'rooms.json');
const STORAGE_TMP_FILE = path.resolve(DATA_DIR, 'rooms.json.tmp');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function sanitizeVideoUrl(url?: string): string {
  if (!url) return 'https://vjs.zencdn.net/v/oceans.mp4';
  if (url.includes('commondatastorage.googleapis.com')) {
    if (url.includes('Sintel')) return 'https://media.w3.org/2010/05/sintel/trailer.mp4';
    if (url.includes('BigBuckBunny') || url.includes('Bullrun')) return 'https://media.w3.org/2010/05/bunny/trailer.mp4';
    return 'https://vjs.zencdn.net/v/oceans.mp4';
  }
  return url;
}

export class RoomStorage {
  private static saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Load persisted rooms from disk.
   */
  public static loadRooms(): Map<string, WatchRoom> {
    const roomsMap = new Map<string, WatchRoom>();
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id) {
              // Ensure video URLs are sanitized from revoked 403 Google Storage bucket
              if (item.playback?.media?.videoUrl) {
                item.playback.media.videoUrl = sanitizeVideoUrl(item.playback.media.videoUrl);
              }
              if (Array.isArray(item.playlist)) {
                for (const pl of item.playlist) {
                  if (pl.media?.videoUrl) {
                    pl.media.videoUrl = sanitizeVideoUrl(pl.media.videoUrl);
                  }
                }
              }
              roomsMap.set(item.id, item);
            }
          }
          console.log(`[Storage] Successfully restored ${roomsMap.size} rooms from persistent disk storage.`);
        }
      }
    } catch (err) {
      console.error('[Storage] Error loading rooms from storage, starting with fallback:', err);
    }
    return roomsMap;
  }

  /**
   * Atomically save rooms to disk.
   */
  public static saveRooms(rooms: Map<string, WatchRoom>, immediate: boolean = false): void {
    const doSave = () => {
      try {
        const serializable = Array.from(rooms.values()).map(room => {
          // Normalize video URLs and participants
          if (room.playback?.media?.videoUrl) {
            room.playback.media.videoUrl = sanitizeVideoUrl(room.playback.media.videoUrl);
          }
          return {
            ...room,
            participants: room.participants.map(p => ({ ...p, online: false }))
          };
        });

        const json = JSON.stringify(serializable, null, 2);
        // Write to tmp file first then rename for atomic write guarantee
        fs.writeFileSync(STORAGE_TMP_FILE, json, 'utf-8');
        fs.renameSync(STORAGE_TMP_FILE, STORAGE_FILE);
      } catch (err) {
        console.error('[Storage] Failed to atomically persist room state:', err);
      }
    };

    if (immediate) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      doSave();
    } else {
      if (!this.saveTimeout) {
        this.saveTimeout = setTimeout(() => {
          this.saveTimeout = null;
          doSave();
        }, 600);
      }
    }
  }
}
