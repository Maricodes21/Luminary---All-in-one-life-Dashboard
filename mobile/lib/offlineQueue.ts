/**
 * Offline write queue — AsyncStorage-backed.
 *
 * When a Supabase write fails (network unavailable), callers enqueue the
 * operation here. The queue is flushed by useOfflineSync whenever the app
 * returns to the foreground.
 *
 * Schema:  each item is a discriminated union so flush() knows how to replay it.
 *
 * Limitations (Phase 2):
 *   - No conflict resolution — last write wins on sync.
 *   - No retry back-off — flush is attempted on every foreground event.
 *   - Duplicate prevention relies on Supabase upsert / unique constraints.
 *
 * Phase 3 can upgrade to TanStack Query's persistQueryClient + networkMode
 * for a more robust solution with built-in back-off.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const QUEUE_KEY = 'luminary.offlineQueue.v1';

// ─── Pending write types ──────────────────────────────────────────────────────

type PendingMoodEvent = {
  type: 'mood_event';
  id: string;
  payload: {
    label: string;
    source: string;
    confidence: number;
    features?: object | null;
  };
};

type PendingSpotifySnapshot = {
  type: 'spotify_snapshot';
  id: string;
  payload: {
    snapshot_date: string;
    tracks_count: number;
    minutes_listened: number;
    top_artists: object;
    avg_valence: number;
    avg_energy: number;
    avg_tempo: number;
    estimated_mood: string;
    estimated_confidence: number;
  };
};

type PendingHabitCompletion = {
  type: 'habit_completion';
  id: string;
  payload: { habit_id: string; completed_on: string };
};

type PendingJournalEntry = {
  type: 'journal_entry';
  id: string;
  payload: { body: string; tags: string[]; mood_event_id: string | null };
};

export type PendingWrite =
  | PendingMoodEvent
  | PendingSpotifySnapshot
  | PendingHabitCompletion
  | PendingJournalEntry;

// ─── Queue operations ─────────────────────────────────────────────────────────

export async function enqueue(item: PendingWrite): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: PendingWrite[] = raw ? (JSON.parse(raw) as PendingWrite[]) : [];
    queue.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[offlineQueue] enqueue failed', err);
  }
}

export async function getQueue(): Promise<PendingWrite[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingWrite[]) : [];
  } catch {
    return [];
  }
}

async function removeById(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: PendingWrite[] = raw ? (JSON.parse(raw) as PendingWrite[]) : [];
    const next = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[offlineQueue] removeById failed', err);
  }
}

// ─── Flush ────────────────────────────────────────────────────────────────────

/**
 * Attempt to replay every queued write against Supabase.
 * Successfully replayed items are removed; failed ones stay for the next flush.
 */
export async function flushQueue(): Promise<{ flushed: number; remaining: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  let flushed = 0;

  for (const item of queue) {
    try {
      await replayWrite(item);
      await removeById(item.id);
      flushed += 1;
    } catch (err) {
      console.warn('[offlineQueue] flush item failed — will retry', item.type, err);
    }
  }

  const remaining = queue.length - flushed;
  return { flushed, remaining };
}

async function replayWrite(item: PendingWrite): Promise<void> {
  switch (item.type) {
    case 'mood_event': {
      const { error } = await supabase.from('mood_events').upsert({
        id: item.id,
        ...item.payload,
      });
      if (error) throw error;
      break;
    }
    case 'spotify_snapshot': {
      const { error } = await supabase.from('spotify_snapshots').upsert(item.payload);
      if (error) throw error;
      break;
    }
    case 'habit_completion': {
      const { error } = await supabase.from('habit_completions').upsert(item.payload);
      if (error) throw error;
      break;
    }
    case 'journal_entry': {
      const { error } = await supabase.from('journal_entries').upsert({
        id: item.id,
        ...item.payload,
      });
      if (error) throw error;
      break;
    }
    default: {
      const _exhaustive: never = item;
      console.warn('[offlineQueue] unknown item type', _exhaustive);
    }
  }
}
