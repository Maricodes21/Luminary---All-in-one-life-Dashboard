import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { EntryCard } from '@/components/journal/EntryCard';
import { useProductionStore } from '@/stores/useProductionStore';

type TabView = 'timeline' | 'trends';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<TabView>('timeline');
  const [draft, setDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const { data: remoteEntries, isLoading } = useJournalEntries();
  const localEntries = useProductionStore((s) => s.journalEntries.filter((entry) => !entry.deletedAt));
  const addJournalEntry = useProductionStore((s) => s.addJournalEntry);
  const deleteJournalEntry = useProductionStore((s) => s.deleteJournalEntry);

  const tags = useMemo(
    () =>
      tagDraft
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagDraft],
  );

  const onSave = () => {
    if (!draft.trim()) return;
    addJournalEntry(draft.trim(), '', tags);
    setDraft('');
    setTagDraft('');
  };

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
          <View>
            <Card>
              <SectionLabel>New entry</SectionLabel>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="What should tonight remember?"
                placeholderTextColor={palette.onSurfaceVariant}
                multiline
                style={styles.entryInput}
              />
              <TextInput
                value={tagDraft}
                onChangeText={setTagDraft}
                placeholder="tags, separated, quietly"
                placeholderTextColor={palette.onSurfaceVariant}
                style={styles.tagInput}
              />
              <Pressable onPress={onSave} style={styles.primaryButton} accessibilityRole="button">
                <Text style={[type.labelMd, { color: palette.onPrimary }]}>Save entry</Text>
              </Pressable>
            </Card>

            {localEntries.map((entry) => (
              <Card key={entry.id} style={{ marginTop: spacing.md }}>
                <Text style={[type.bodyMd, { color: palette.onSurface }]}>{entry.body}</Text>
                <View style={styles.entryMeta}>
                  <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
                    {new Date(entry.writtenAt).toLocaleDateString()}
                    {entry.tags.length ? ` / ${entry.tags.join(', ')}` : ''}
                  </Text>
                  <Pressable onPress={() => deleteJournalEntry(entry.id)} accessibilityRole="button">
                    <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            ))}

            {isLoading ? (
              <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />
            ) : remoteEntries && remoteEntries.length > 0 ? (
              remoteEntries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
            ) : localEntries.length === 0 ? (
              <Card style={{ marginTop: spacing.lg }}>
                <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                  Nothing here yet. Tonight could be the first one.
                </Text>
              </Card>
            ) : null}
          </View>
        )}

        {view === 'trends' && (
          <View>
            <Card style={{ marginTop: spacing.lg }}>
              <SectionLabel>Weekly mood</SectionLabel>
              <View style={styles.placeholderChart}>
                <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>
                  More data needed to plot your trends. Keep checking in.
                </Text>
              </View>
            </Card>

            <Card style={{ marginTop: spacing.md }} variant="recessed">
              <SectionLabel>Insight</SectionLabel>
              <Text style={[type.bodyMd, { color: palette.onSurface, marginTop: spacing.xs }]}>
                Your entries are now saved locally first, then queued for sync when the database is ready.
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
  entryInput: {
    minHeight: 110,
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    textAlignVertical: 'top',
  },
  tagInput: {
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  placeholderChart: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: palette.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
  },
});
