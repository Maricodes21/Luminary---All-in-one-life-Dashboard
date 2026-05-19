import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { writeJournalEntry } from '@/lib/ritual';
import { useRitualStore } from '@/stores/useRitualStore';

const PROMPTS = [
  'What surprised you today?',
  "What's still sitting with you?",
  'What did you let go of today?',
  'What felt hard, and what helped?',
  'If today had a colour, what would it be?',
] as const;

const TAG_CHIPS = ['#work', '#body', '#people', '#money', '#home', '#mind'] as const;

// Pick once at module evaluation time so it stays stable across re-renders
// without needing a ref or state — the prompt only needs to rotate between sessions.
function pickPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export function JournalStep() {
  const moodEventId = useRitualStore((s) => s.moodEventId);
  const journalText = useRitualStore((s) => s.journalText);
  const journalTags = useRitualStore((s) => s.journalTags);
  const setJournalText = useRitualStore((s) => s.setJournalText);
  const setJournalTags = useRitualStore((s) => s.setJournalTags);
  const setStage = useRitualStore((s) => s.setStage);

  // Stable for this component's lifetime — survives re-renders, resets on unmount.
  const promptRef = useRef<string>(pickPrompt());
  const prompt = promptRef.current;

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleToggleTag(tag: string) {
    if (journalTags.includes(tag)) {
      setJournalTags(journalTags.filter((t) => t !== tag));
    } else {
      setJournalTags([...journalTags, tag]);
    }
  }

  async function handleCapture() {
    if (journalText.trim().length === 0) {
      setValidationError('Write something first, or skip below.');
      return;
    }

    setValidationError(null);
    setSaveError(null);
    setIsSaving(true);

    try {
      await writeJournalEntry({
        body: journalText.trim(),
        tags: journalTags,
        moodEventId,
      });
      setStage('habits');
    } catch {
      setSaveError("We couldn't save that. Try again?");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkip() {
    setStage('habits');
  }

  const activeError = validationError ?? saveError;

  return (
    <View style={styles.container}>
      <Text style={[type.displayMd, styles.prompt]}>{prompt}</Text>

      <TextInput
        value={journalText}
        onChangeText={(text) => {
          setJournalText(text);
          if (validationError) setValidationError(null);
        }}
        placeholder="Write something, or don't."
        placeholderTextColor={palette.onSurfaceVariant}
        multiline
        textAlignVertical="top"
        style={[type.bodyLg, styles.input]}
        accessibilityLabel="Journal entry"
        accessibilityHint={prompt}
      />

      <View style={styles.tagRow}>
        {TAG_CHIPS.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            selected={journalTags.includes(tag)}
            onPress={() => handleToggleTag(tag)}
          />
        ))}
      </View>

      {/* Voice note — stub only, no audio logic */}
      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityLabel="Voice note — coming in a future update"
        style={styles.voiceBtn}
      >
        <Icon name="journal" size={18} color={palette.onSurfaceVariant} />
        <Text style={[type.bodySm, styles.voiceBtnLabel]}>Voice note (coming soon)</Text>
      </Pressable>

      {activeError && (
        <Text style={[type.bodySm, styles.errorText]}>{activeError}</Text>
      )}

      <View style={styles.buttonStack}>
        <Pressable
          onPress={handleCapture}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Capture journal entry"
          style={({ pressed }) => [
            styles.primaryBtn,
            (pressed || isSaving) && { opacity: 0.75 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={palette.onPrimary} />
          ) : (
            <Text style={[type.titleMd, { color: palette.onPrimary }]}>Capture</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleSkip}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Skip journal for now"
          style={({ pressed }) => [
            styles.tertiaryBtn,
            pressed && { opacity: 0.75 },
          ]}
        >
          <Text style={[type.titleMd, { color: palette.onSurfaceVariant }]}>Skip for now</Text>
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
  input: {
    backgroundColor: palette.surfaceContainer,
    borderRadius: radii.sm,
    padding: spacing.md,
    color: palette.onSurface,
    minHeight: 120,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    opacity: 0.45,
  },
  voiceBtnLabel: {
    color: palette.onSurfaceVariant,
  },
  errorText: {
    color: palette.error,
  },
  buttonStack: {
    gap: spacing.sm,
    marginTop: spacing.xs,
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
});
