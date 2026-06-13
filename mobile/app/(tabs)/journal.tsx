import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { EntryCard } from '@/components/journal/EntryCard';

type TabView = 'timeline' | 'trends';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<TabView>('timeline');
  const { data: entries, isLoading } = useJournalEntries();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <SectionLabel>Reflection</SectionLabel>
        <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>
          Your inner weather
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segments}>
        <Pressable
          onPress={() => setView('timeline')}
          style={[styles.segment, view === 'timeline' && styles.segmentActive]}
        >
          <Text style={[type.labelMd, view === 'timeline' ? { color: palette.onSurface } : { color: palette.onSurfaceVariant }]}>
            Timeline
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setView('trends')}
          style={[styles.segment, view === 'trends' && styles.segmentActive]}
        >
          <Text style={[type.labelMd, view === 'trends' ? { color: palette.onSurface } : { color: palette.onSurfaceVariant }]}>
            Trends
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {view === 'timeline' && (
          <View>
            {isLoading ? (
              <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />
            ) : entries && entries.length > 0 ? (
              entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
            ) : (
              <Card style={{ marginTop: spacing.lg }}>
                <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                  Nothing here yet. Tonight could be the first one.
                </Text>
              </Card>
            )}
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
                You seem more grounded on days when your music tempo is lower.
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
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
  segmentActive: {
    backgroundColor: palette.surfaceContainerHigh,
  },
  content: { paddingHorizontal: spacing.md },
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
