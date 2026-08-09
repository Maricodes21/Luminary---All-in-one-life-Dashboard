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
import type { DailyRitualSession } from '@/lib/dailyRitual';

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
};

/**
 * Upsert today's spotify_snapshot. Safe to call multiple times in a session
 * (unique constraint on user_id + snapshot_date).
 */
export async function writeSpotifySnapshot(params: WriteSpotifySnapshotParams): Promise<void> {
  const { recap } = params;
  const payload = {
    snapshot_date: recap.date,
    tracks_count: recap.trackCount,
    minutes_listened: recap.minutesListened,
    top_artists: recap.topArtists,
    avg_valence: null,
    avg_energy: null,
    avg_tempo: null,
    estimated_mood: null,
    estimated_confidence: null,
  };

  const { error } = await supabase.from('spotify_snapshots').upsert(payload as never);
  if (error) {
    await enqueue({ type: 'spotify_snapshot', id: `snapshot-${recap.date}`, payload: payload as never });
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

// --- Daily ritual session ----------------------------------------------------

/**
 * Persist the current daily ritual checkpoint. The same shape is queued when
 * offline so closing the app never turns a completed ritual back into an
 * unfinished one.
 */
export async function writeDailyRitualSession(session: DailyRitualSession): Promise<void> {
  const payload = {
    id: session.id,
    session_date: session.localDate,
    status: session.status,
    current_stage: session.currentStage,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    mood: session.mood,
    mood_skipped: session.moodSkipped,
    journal_added: session.journalAdded,
    selected_signal_ids: session.selectedSignalIds,
    summary: session.summary,
  };

  const { error } = await supabase
    .from('daily_ritual_sessions')
    .upsert(payload, { onConflict: 'user_id,session_date' });

  if (error) {
    await enqueue({ type: 'daily_ritual_session', id: session.id, payload });
  }
}
