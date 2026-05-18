/**
 * Ritual database writes — pure async functions over the Supabase client.
 *
 * Architecture note: no React imports here. These are called from hooks or
 * event handlers; the offline queue (Stage 8) will wrap them in a mutation
 * layer. For now, writes are direct — errors propagate to the caller.
 */
import { supabase } from '@/lib/supabase';
import type { MoodLabel, MoodSource } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';

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
  const { data, error } = await supabase
    .from('mood_events')
    .insert({
      label: params.label,
      source: params.source,
      confidence: params.confidence,
      features: params.features ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
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
  const { error } = await supabase.from('spotify_snapshots').upsert({
    snapshot_date: recap.date,
    tracks_count: recap.trackCount,
    minutes_listened: recap.minutesListened,
    top_artists: recap.topArtists,
    avg_valence: recap.averageFeatures.valence,
    avg_energy: recap.averageFeatures.energy,
    avg_tempo: recap.averageFeatures.tempo,
    estimated_mood: estimatedMood,
    estimated_confidence: estimatedConfidence,
  });

  if (error) throw error;
}

// ─── Journal entry ────────────────────────────────────────────────────────────

export type WriteJournalEntryParams = {
  body: string;
  tags: string[];
  moodEventId: string | null;
};

export async function writeJournalEntry(params: WriteJournalEntryParams): Promise<string> {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      body: params.body,
      tags: params.tags,
      mood_event_id: params.moodEventId,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}
