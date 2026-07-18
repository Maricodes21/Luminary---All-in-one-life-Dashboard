/**
 * Ritual database writes — pure async functions over the Supabase client.
 *
 * Architecture note: no React imports here. These are called from hooks or
 * event handlers; the offline queue (Stage 8) will wrap them in a mutation
 * layer. For now, writes are direct — errors propagate to the caller.
 */
import { supabase } from '@/lib/supabase';
import { enqueue } from '@/lib/offlineQueue';
import type { MoodLabel, MoodSource } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';

function uuid(): string {
  // crypto.randomUUID is available in Hermes (RN 0.73+) and on web.
  // Fallback for older environments.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Mood event ───────────────────────────────────────────────────────────────

export type WriteMoodEventParams = {
  label: MoodLabel;
  source: MoodSource;
  confidence: number;
  features?: { valence: number; energy: number; tempo?: number };
};

/**
 * Insert a mood_event row and return its UUID.
 * Throws on Supabase error so callers can surface it.
 */
export async function writeMoodEvent(params: WriteMoodEventParams): Promise<string> {
  const id = uuid();
  const payload = {
    label: params.label,
    source: params.source,
    confidence: params.confidence,
    features: params.features ?? null,
  };

  const { data, error } = await supabase
    .from('mood_events')
    .insert({ id, ...payload })
    .select('id')
    .single();

  if (error) {
    // Queue for later sync — ritual must not block on network.
    await enqueue({ type: 'mood_event', id, payload });
    return id;
  }
  return data.id as string;
}

// ─── Spotify snapshot ─────────────────────────────────────────────────────────

export type WriteSpotifySnapshotParams = {
  recap: SpotifyRecap;
  estimatedMood: MoodLabel;
  estimatedConfidence: number;
};

/**
 * Upsert today's spotify_snapshot. Safe to call multiple times in a session
 * (unique constraint on user_id + snapshot_date).
 */
export async function writeSpotifySnapshot(params: WriteSpotifySnapshotParams): Promise<void> {
  const { recap, estimatedMood, estimatedConfidence } = params;
  const payload = {
    snapshot_date: recap.date,
    tracks_count: recap.trackCount,
    minutes_listened: recap.minutesListened,
    top_artists: recap.topArtists,
    avg_valence: recap.averageFeatures.valence,
    avg_energy: recap.averageFeatures.energy,
    avg_tempo: recap.averageFeatures.tempo,
    estimated_mood: estimatedMood,
    estimated_confidence: estimatedConfidence,
  };

  const { error } = await supabase.from('spotify_snapshots').upsert(payload);
  if (error) {
    await enqueue({ type: 'spotify_snapshot', id: `snapshot-${recap.date}`, payload });
  }
}

// ─── Habit completions ────────────────────────────────────────────────────────

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function writeHabitCompletion(habitId: string): Promise<void> {
  const payload = { habit_id: habitId, completed_on: todayIso() };
  const { error } = await supabase.from('habit_completions').upsert(payload);
  if (error) {
    await enqueue({ type: 'habit_completion', id: `${habitId}-${todayIso()}`, payload });
  }
}

export async function deleteHabitCompletion(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('habit_id', habitId)
    .eq('completed_on', todayIso());
  if (error) throw error;
}

// ─── Habit pauses (tomorrow section) ─────────────────────────────────────────

export async function writeHabitPause(habitId: string): Promise<void> {
  const { error } = await supabase.from('habit_pauses').upsert({
    habit_id: habitId,
    pause_date: tomorrowIso(),
  });
  if (error) throw error;
}

export async function deleteHabitPause(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habit_pauses')
    .delete()
    .eq('habit_id', habitId)
    .eq('pause_date', tomorrowIso());
  if (error) throw error;
}

// ─── Journal entry ────────────────────────────────────────────────────────────

export type WriteJournalEntryParams = {
  body: string;
  tags: string[];
  moodEventId: string | null;
};

export async function writeJournalEntry(params: WriteJournalEntryParams): Promise<string> {
  const id = uuid();
  const payload = {
    body: params.body,
    tags: params.tags,
    mood_event_id: params.moodEventId,
  };

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ id, ...payload })
    .select('id')
    .single();

  if (error) {
    await enqueue({ type: 'journal_entry', id, payload });
    return id;
  }
  return data.id as string;
}
