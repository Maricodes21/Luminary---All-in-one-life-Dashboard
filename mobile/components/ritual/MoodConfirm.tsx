/**
 * MoodConfirm — Stage 2 of the ritual.
 *
 * Internal phase machine:
 *   'initial'        → "That's about right" / "Not quite right"
 *   'detail-prompt'  → after spotify confirm: "Would you like to give more detail?"
 *   'chips'          → after reject: manual 15-label chip grid
 *   'write-prompt'   → after chip selection: "Would you like to write how you really feel?"
 *
 * Supabase writes happen at the decision point (confirm or chip select), not
 * on the follow-up buttons — the mood is already committed by then.
 */
import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { MoodChipGrid } from '@/components/ritual/MoodChipGrid';
import { mapAudioFeaturesToMood, moodCopy } from '@/lib/mood';
import { writeMoodEvent, writeSpotifySnapshot } from '@/lib/ritual';
import { useRitualStore } from '@/stores/useRitualStore';
import type { MoodLabel } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';

type MoodConfirmPhase = 'initial' | 'detail-prompt' | 'chips' | 'write-prompt';

type MoodConfirmProps = {
  recap: SpotifyRecap;
  /** Called when mood flow is done. `wantsJournal` tells parent whether to show journal step. */
  onComplete: (wantsJournal: boolean) => void;
};

export function MoodConfirm({ recap, onComplete }: MoodConfirmProps) {
  const setMood = useRitualStore((s) => s.setMood);
  const setMoodEventId = useRitualStore((s) => s.setMoodEventId);

  const [phase, setPhase] = useState<MoodConfirmPhase>('initial');
  const [selectedChip, setSelectedChip] = useState<MoodLabel | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const spotifyMood = mapAudioFeaturesToMood(recap.averageFeatures);

  // ── Spotify confirm path ────────────────────────────────────────────────────

  async function handleConfirm() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const [id] = await Promise.all([
        writeMoodEvent({
          label: spotifyMood.label,
          source: 'spotify',
          confidence: spotifyMood.confidence,
          features: recap.averageFeatures,
        }),
        writeSpotifySnapshot({
          recap,
          estimatedMood: spotifyMood.label,
          estimatedConfidence: spotifyMood.confidence,
        }),
      ]);
      setMood({ label: spotifyMood.label, source: 'spotify', confidence: spotifyMood.confidence });
      setMoodEventId(id);
      setPhase('detail-prompt');
    } catch {
      setSaveError("Couldn't save your mood. Try again?");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Manual chip path ────────────────────────────────────────────────────────

  async function handleChipSelect(label: MoodLabel) {
    setSelectedChip(label);
    setIsSaving(true);
    setSaveError(null);
    try {
      const id = await writeMoodEvent({
        label,
        source: 'manual',
        confidence: 1.0,
      });
      setMood({ label, source: 'manual', confidence: 1.0 });
      setMoodEventId(id);
      setPhase('write-prompt');
    } catch {
      setSelectedChip(null);
      setSaveError("Couldn't save your mood. Try again?");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'initial') {
    return (
      <View style={styles.container}>
        {saveError && (
          <Text style={[type.bodySm, styles.errorText]}>{saveError}</Text>
        )}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleConfirm}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="That's about right"
            style={({ pressed }) => [styles.primaryBtn, (pressed || isSaving) && { opacity: 0.75 }]}
          >
            {isSaving
              ? <ActivityIndicator color={palette.onPrimary} />
              : <Text style={[type.titleMd, { color: palette.onPrimary }]}>That's about right</Text>
            }
          </Pressable>
          <Pressable
            onPress={() => setPhase('chips')}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Not quite right"
            style={({ pressed }) => [styles.tertiaryBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={[type.titleMd, { color: palette.onSurfaceVariant }]}>Not quite right</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'detail-prompt') {
    return (
      <View style={styles.container}>
        <Text style={[type.titleLg, styles.prompt]}>Would you like to give more detail?</Text>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => onComplete(true)}
            accessibilityRole="button"
            accessibilityLabel="Yes, I'd like to write more"
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={[type.titleMd, { color: palette.onPrimary }]}>Yes</Text>
          </Pressable>
          <Pressable
            onPress={() => onComplete(false)}
            accessibilityRole="button"
            accessibilityLabel="Not right now, skip journal"
            style={({ pressed }) => [styles.tertiaryBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={[type.titleMd, { color: palette.onSurfaceVariant }]}>Not right now</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'chips') {
    return (
      <View style={styles.container}>
        <Text style={[type.bodyMd, styles.chipPrompt]}>
          How are you <Text style={{ color: palette.primary, fontStyle: 'italic' }}>really</Text> feeling?
        </Text>
        {saveError && (
          <Text style={[type.bodySm, styles.errorText]}>{saveError}</Text>
        )}
        <MoodChipGrid
          selected={selectedChip}
          onSelect={isSaving ? () => {} : handleChipSelect}
        />
        {isSaving && (
          <ActivityIndicator
            color={palette.primary}
            style={{ marginTop: spacing.sm }}
          />
        )}
      </View>
    );
  }

  // phase === 'write-prompt'
  const confirmedCopy = selectedChip ? moodCopy[selectedChip].display : '';
  return (
    <View style={styles.container}>
      <Text style={[type.bodyMd, styles.chipPrompt]}>
        <Text style={{ color: palette.onSurface, fontWeight: '600' }}>{confirmedCopy}</Text>
        {' '}noted.
      </Text>
      <Text style={[type.titleLg, styles.prompt]}>
        Would you like to write how you really feel?
      </Text>
      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => onComplete(true)}
          accessibilityRole="button"
          accessibilityLabel="Yes, I'd like to write about it"
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={[type.titleMd, { color: palette.onPrimary }]}>Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => onComplete(false)}
          accessibilityRole="button"
          accessibilityLabel="Not right now, skip journal"
          style={({ pressed }) => [styles.tertiaryBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={[type.titleMd, { color: palette.onSurfaceVariant }]}>Not right now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  prompt: {
    color: palette.onSurface,
  },
  chipPrompt: {
    color: palette.onSurfaceVariant,
  },
  buttonRow: {
    gap: spacing.sm,
  },
  primaryBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
    minHeight: 52,
  },
  tertiaryBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    minHeight: 52,
  },
  errorText: {
    color: palette.error,
  },
});
