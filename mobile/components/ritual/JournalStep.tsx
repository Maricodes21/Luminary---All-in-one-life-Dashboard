import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { moodCopy } from '@/lib/mood';
import { writeJournalEntry } from '@/lib/ritual';
import { useRitualStore } from '@/stores/useRitualStore';

const TAG_CHIPS = ['music', 'work', 'body', 'people', 'home', 'mind'] as const;

export function JournalStep() {
  const mood = useRitualStore((state) => state.mood);
  const moodEventId = useRitualStore((state) => state.moodEventId);
  const journalText = useRitualStore((state) => state.journalText);
  const journalTags = useRitualStore((state) => state.journalTags);
  const setJournalText = useRitualStore((state) => state.setJournalText);
  const setJournalTags = useRitualStore((state) => state.setJournalTags);
  const setJournalAdded = useRitualStore((state) => state.setJournalAdded);
  const setStage = useRitualStore((state) => state.setStage);
  const [isSaving, setIsSaving] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);

  const moodDisplay = mood ? moodCopy[mood.label].display : 'Today';

  function toggleTag(tag: string) {
    setJournalTags(journalTags.includes(tag) ? journalTags.filter((item) => item !== tag) : [...journalTags, tag]);
  }

  async function handleCapture() {
    if (!journalText.trim()) {
      setActiveError('Write one line first, or skip Journal.');
      return;
    }
    setActiveError(null);
    setIsSaving(true);
    try {
      await writeJournalEntry({ body: journalText.trim(), tags: journalTags, moodEventId });
      setJournalAdded(true);
      setStage('habits');
    } catch {
      setActiveError("We couldn't save that. Try again?");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkip() {
    setJournalAdded(false);
    setStage('habits');
  }

  return (
    <View style={styles.container}>
      <View style={styles.moodLink}>
        <Text style={[type.labelSm, styles.accent]}>Going to Journal</Text>
        <Text style={[type.headlineSm, styles.title]}>{moodDisplay}</Text>
        <Text style={[type.bodySm, styles.copy]}>
          {mood?.source === 'spotify' ? 'Your music suggested this mood. Add what it meant—or move on without writing.' : 'You chose this mood. Add what it meant—or move on without writing.'}
        </Text>
      </View>

      <View style={styles.composer}>
        <Text style={[type.labelSm, styles.copy]}>What made today feel {moodDisplay.toLowerCase()}?</Text>
        <TextInput
          value={journalText}
          onChangeText={(text) => { setJournalText(text); if (activeError) setActiveError(null); }}
          placeholder="The day felt louder than it looked."
          placeholderTextColor={palette.onSurfaceVariant}
          multiline
          textAlignVertical="top"
          style={[type.headlineSm, styles.input]}
          accessibilityLabel="Journal entry"
        />
        <View style={styles.tagRow}>
          {TAG_CHIPS.map((tag) => {
            const selected = journalTags.includes(tag);
            return (
              <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, selected && styles.tagSelected]} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}>
                <Text style={[type.labelSm, selected ? styles.accent : styles.title]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeError ? <Text style={[type.bodySm, styles.error]}>{activeError}</Text> : null}
      <View style={styles.actionRow}>
        <Pressable onPress={handleSkip} disabled={isSaving} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={[type.labelMd, styles.title]}>Skip Journal</Text>
        </Pressable>
        <Pressable onPress={handleCapture} disabled={isSaving} style={({ pressed }) => [styles.primaryButton, (pressed || isSaving) && styles.disabled]} accessibilityRole="button">
          {isSaving ? <ActivityIndicator color={palette.onPrimary} /> : <Text style={[type.labelMd, styles.primaryText]}>Add to Journal</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  moodLink: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh },
  composer: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerLow },
  input: { minHeight: 160, padding: spacing.md, borderRadius: radii.md, color: palette.onSurface, backgroundColor: palette.surfaceContainerLowest },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { width: '31%', flexGrow: 1, minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radii.pill },
  tagSelected: { backgroundColor: palette.primaryContainer },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow },
  primaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.primary },
  title: { color: palette.onSurface },
  copy: { color: palette.onSurfaceVariant },
  accent: { color: palette.primary },
  primaryText: { color: palette.onPrimary },
  error: { color: palette.error },
  pressed: { opacity: 0.74 },
  disabled: { opacity: 0.48 },
});
