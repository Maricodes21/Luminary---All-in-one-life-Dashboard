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
 *   - Legacy entries created before owner scoping remain local and require an
 *     explicit migration; they are never replayed into a different account.
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

type PendingDailyRitualSession = {
  type: 'daily_ritual_session';
  id: string;
  payload: {
    id: string;
    session_date: string;
    status: string;
    current_stage: string;
    started_at: string | null;
    completed_at: string | null;
    mood: string | null;
    mood_skipped: boolean;
    journal_added: boolean;
    selected_signal_ids: string[];
    summary: object | null;
  };
};

type PendingAiReflection = {
  type: 'ai_reflection';
  id: string;
  action: 'upsert' | 'delete';
  payload: {
    id: string;
    user_id: string;
    local_date: string;
    generated_at: string;
    model: string;
    theme: string;
    reflection: string;
    question: string;
    evidence_categories: string[];
    confidence: number;
    status: 'pending' | 'accepted';
  };
};

export type PendingWrite =
  | PendingMoodEvent
  | PendingSpotifySnapshot
  | PendingHabitCompletion
  | PendingJournalEntry
  | PendingDailyRitualSession
  | PendingAiReflection;

export type OwnedPendingWrite = PendingWrite & { ownerId?: string };

// ─── Queue operations ─────────────────────────────────────────────────────────

export async function enqueue(item: PendingWrite): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const ownerId = data.session?.user.id;
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OwnedPendingWrite[] = raw ? (JSON.parse(raw) as OwnedPendingWrite[]) : [];
    queue.push({ ...item, ...(ownerId ? { ownerId } : {}) });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[offlineQueue] enqueue failed', err);
  }
}

export async function getQueue(): Promise<OwnedPendingWrite[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OwnedPendingWrite[]) : [];
  } catch {
    return [];
  }
}

async function removeById(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OwnedPendingWrite[] = raw ? (JSON.parse(raw) as OwnedPendingWrite[]) : [];
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
export async function flushQueue(
  ownerId: string | null,
): Promise<{ flushed: number; remaining: number }> {
  const queue = await getQueue();
  if (queue.length === 0 || !ownerId) return { flushed: 0, remaining: queue.length };

  let flushed = 0;

  for (const item of queue.filter((pending) => pending.ownerId === ownerId)) {
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
    case 'daily_ritual_session': {
      const { error } = await supabase
        .from('daily_ritual_sessions')
        .upsert(item.payload, { onConflict: 'user_id,session_date' });
      if (error) throw error;
      break;
    }
    case 'ai_reflection': {
      if (item.action === 'delete') {
        const { error } = await supabase
          .from('ai_reflections')
          .delete()
          .eq('id', item.payload.id)
          .eq('user_id', item.payload.user_id);
        if (error) throw error;
        break;
      }
      const { error } = await supabase.from('ai_reflections').upsert(item.payload);
      if (error) throw error;
      break;
    }
    default: {
      const _exhaustive: never = item;
      console.warn('[offlineQueue] unknown item type', _exhaustive);
    }
  }
}
