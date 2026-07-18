import { useState } from 'react';
import { Alert, ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { useDeleteJournalEntry, useJournalEntries } from '@/hooks/useJournalEntries';
import { EntryCard } from '@/components/journal/EntryCard';
import { MultiChoiceField } from '@/components/ui';
import { useProductionStore } from '@/stores/useProductionStore';
import { journalPrompts, moodTags } from '@/lib/modulePresets';

type TabView = 'timeline' | 'trends';
type EntryDeleteContext = { id: string; title: string | null; body: string };

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<TabView>('timeline');
  const [draft, setDraft] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(journalPrompts[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { data: remoteEntries, isLoading, isError } = useJournalEntries();
  const remoteDeletion = useDeleteJournalEntry();
  const localEntries = useProductionStore((s) => s.journalEntries.filter((entry) => !entry.deletedAt));
  const addJournalEntry = useProductionStore((s) => s.addJournalEntry);
  const deleteJournalEntry = useProductionStore((s) => s.deleteJournalEntry);

  const entriesNeeded = Math.max(0, 3 - localEntries.length);

  const onSave = () => {
    if (!draft.trim()) return;
    addJournalEntry(draft.trim(), selectedPrompt, selectedTags);
    setDraft('');
    setSelectedTags([]);
  };

  const entryContext = (entry: EntryDeleteContext) =>
    entry.title?.trim() || entry.body.trim().slice(0, 80);

  const confirmLocalDelete = (entry: EntryDeleteContext) => Alert.alert(
    'Delete journal entry?',
    `"${entryContext(entry)}" will be permanently removed after your changes sync.`,
    [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteJournalEntry(entry.id) },
    ],
  );

  const confirmRemoteDelete = (entry: EntryDeleteContext) => Alert.alert(
    'Delete journal entry?',
    `"${entryContext(entry)}" permanently removes the entry from your journal.`,
    [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void remoteDeletion.mutateAsync(entry.id).catch(() => {
          Alert.alert('Could not delete entry', 'The entry is still here. Please try again.');
        }),
      },
    ],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <SectionLabel>Reflection</SectionLabel>
        <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>Your inner weather</Text>
      </View>

      <View style={styles.segments}>
        <Segment label="Timeline" active={view === 'timeline'} onPress={() => setView('timeline')} />
        <Segment label="Trends" active={view === 'trends'} onPress={() => setView('trends')} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        {view === 'timeline' && (
          <View style={styles.timelineStack}>
            <Card>
              <SectionLabel>New entry</SectionLabel>
              <Text style={[type.titleMd, { color: palette.onSurface, marginTop: spacing.xs }]}>{selectedPrompt}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptStrip}>
                {journalPrompts.map((prompt, index) => (
                  <Pressable
                    key={prompt}
                    onPress={() => setSelectedPrompt(prompt)}
                    style={[styles.promptChip, selectedPrompt === prompt && styles.promptChipActive]}
                  >
                    <Text
                      style={[
                        type.bodySm,
                        { color: selectedPrompt === prompt ? palette.onPrimary : palette.onSurfaceVariant },
                      ]}
                    >
                      Prompt {index + 1}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="What should tonight remember?"
                placeholderTextColor={palette.onSurfaceVariant}
                multiline
                style={styles.entryInput}
              />
              <MultiChoiceField
                label="Tags"
                value={selectedTags}
                suggestions={moodTags}
                onChange={setSelectedTags}
                allowCustom
                customPlaceholder="Add a tag"
              />
              <Pressable onPress={onSave} style={styles.primaryButton} accessibilityRole="button">
                <Text style={[type.labelMd, { color: palette.onPrimary }]}>Save entry</Text>
              </Pressable>
            </Card>

            {localEntries.map((entry) => (
              <Card key={entry.id}>
                <View style={styles.entryTop}>
                  <View style={styles.entryIcon}>
                    <Icon name="journal" size={18} color={palette.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {entry.title ? <Text style={[type.labelSm, { color: palette.primary }]}>{entry.title}</Text> : null}
                    <Text style={[type.bodyMd, { color: palette.onSurface, marginTop: entry.title ? spacing.xs : 0 }]}>
                      {entry.body}
                    </Text>
                  </View>
                </View>
                <View style={styles.entryMeta}>
                  <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
                    {new Date(entry.writtenAt).toLocaleDateString()}
                    {entry.tags.length ? ` / ${entry.tags.join(', ')}` : ''}
                  </Text>
                  <Pressable
                    onPress={() => confirmLocalDelete(entry)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete journal entry"
                  >
                    <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            ))}

            {isLoading ? (
              <ActivityIndicator color={palette.primary} />
            ) : isError ? (
              <Card variant="recessed">
                <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                  Your synced entries could not load. Please try again.
                </Text>
              </Card>
            ) : remoteEntries && remoteEntries.length > 0 ? (
              remoteEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={() => confirmRemoteDelete(entry)}
                  deleting={remoteDeletion.isPending && remoteDeletion.variables === entry.id}
                />
              ))
            ) : localEntries.length === 0 ? (
              <Card variant="recessed">
                <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                  Nothing here yet. Start with one honest sentence.
                </Text>
              </Card>
            ) : null}
          </View>
        )}

        {view === 'trends' && (
          <View>
            <Card>
              <View style={styles.trendHeader}>
                <View>
                  <SectionLabel>Weekly mood</SectionLabel>
                  <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
                    {entriesNeeded ? `${entriesNeeded} more entries to unlock` : 'Enough signal to begin'}
                  </Text>
                </View>
                <Icon name="trend" color={palette.primary} size={24} />
              </View>
              <View style={styles.trendBars}>
                {[0.35, 0.6, 0.42, 0.76, 0.52, 0.7, 0.5].map((value, index) => (
                  <View key={index} style={styles.trendBarColumn}>
                    <View style={[styles.trendBar, { height: 34 + value * 74, opacity: entriesNeeded ? 0.35 : 1 }]} />
                    <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{index + 1}</Text>
                  </View>
                ))}
              </View>
              <ProgressBar value={localEntries.length} max={3} color={palette.primary} style={{ marginTop: spacing.md }} />
            </Card>

            <Card style={{ marginTop: spacing.md }} variant="recessed">
              <SectionLabel>Insight preview</SectionLabel>
              <Text style={[type.bodyMd, { color: palette.onSurface, marginTop: spacing.xs }]}>
                Luminary will look for repeated tags, energy shifts, and the days that ask for softer plans.
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, active && styles.segmentActive]}>
      <Text style={[type.labelMd, active ? { color: palette.onSurface } : { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  header: { paddingHorizontal: spacing.md },
  segments: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radii.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  segmentActive: { backgroundColor: palette.surfaceContainerHigh },
  content: { paddingHorizontal: spacing.md },
  timelineStack: { gap: spacing.md },
  promptStrip: { gap: spacing.sm, paddingRight: spacing.md, marginTop: spacing.md },
  promptChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
  },
  promptChipActive: { backgroundColor: palette.primary },
  entryInput: {
    minHeight: 120,
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  entryTop: { flexDirection: 'row', gap: spacing.md },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  trendBars: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    backgroundColor: palette.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  trendBarColumn: { alignItems: 'center', gap: spacing.xs },
  trendBar: {
    width: 18,
    borderRadius: radii.pill,
    backgroundColor: palette.primary,
  },
});
