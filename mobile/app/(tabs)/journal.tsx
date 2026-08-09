import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { MultiChoiceField } from '@/components/ui';
import { useDeleteJournalEntry, useJournalEntries } from '@/hooks/useJournalEntries';
import { useProductionStore } from '@/stores/useProductionStore';
import { moodTags } from '@/lib/modulePresets';
import { deriveJournalPatterns, selectJournalPrompts } from '@/lib/journal';

type TabView = 'timeline' | 'trends';
type PeriodMode = 'week' | 'month';
type EntryDeleteContext = { id: string; title: string | null; body: string };
type TimelineEntry = EntryDeleteContext & {
  source: 'local' | 'synced';
  writtenAt: string;
  tags: string[];
};

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<TabView>('timeline');
  const [draft, setDraft] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('week');
  const [periodOffset, setPeriodOffset] = useState(0);
  const { data: remoteEntries = [], isLoading, isError } = useJournalEntries();
  const remoteDeletion = useDeleteJournalEntry();
  const localEntries = useProductionStore((state) =>
    state.journalEntries.filter((entry) => !entry.deletedAt),
  );
  const addJournalEntry = useProductionStore((state) => state.addJournalEntry);
  const deleteJournalEntry = useProductionStore((state) => state.deleteJournalEntry);

  const entries = useMemo<TimelineEntry[]>(() => {
    const combined: TimelineEntry[] = [
      ...localEntries.map((entry) => ({
        id: entry.id,
        source: 'local' as const,
        writtenAt: entry.writtenAt,
        title: entry.title || null,
        body: entry.body,
        tags: entry.tags,
      })),
      ...remoteEntries.map((entry) => ({
        id: entry.id,
        source: 'synced' as const,
        writtenAt: entry.written_at,
        title: entry.title,
        body: entry.body,
        tags: entry.tags ?? [],
      })),
    ];
    const unique = new Map<string, TimelineEntry>();
    combined.forEach((entry) => {
      const signature = `${entry.writtenAt}-${entry.body.trim()}`;
      if (!unique.has(signature) || entry.source === 'local') unique.set(signature, entry);
    });
    return [...unique.values()].sort(
      (left, right) => new Date(right.writtenAt).getTime() - new Date(left.writtenAt).getTime(),
    );
  }, [localEntries, remoteEntries]);

  const periodRange = useMemo(
    () => getPeriodRange(periodMode, periodOffset),
    [periodMode, periodOffset],
  );
  const visibleEntries = entries.filter((entry) => {
    const writtenAt = new Date(entry.writtenAt).getTime();
    return writtenAt >= periodRange.start.getTime() && writtenAt < periodRange.end.getTime();
  });
  const entriesNeeded = Math.max(0, 3 - entries.length);
  const journalPrompts = useMemo(
    () => selectJournalPrompts({ now: new Date(), entries, limit: 4 }),
    [entries],
  );
  const patterns = useMemo(() => deriveJournalPatterns(entries), [entries]);

  function onSave() {
    if (!draft.trim()) return;
    addJournalEntry(draft.trim(), selectedPrompt ?? '', selectedTags);
    setDraft('');
    setSelectedTags([]);
    setPeriodMode('week');
    setPeriodOffset(0);
  }

  const entryContext = (entry: EntryDeleteContext) =>
    entry.title?.trim() || entry.body.trim().slice(0, 80);

  const confirmLocalDelete = (entry: EntryDeleteContext) =>
    Alert.alert(
      'Delete journal entry?',
      `"${entryContext(entry)}" will be permanently removed after your changes sync.`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteJournalEntry(entry.id) },
      ],
    );

  const confirmRemoteDelete = (entry: EntryDeleteContext) =>
    Alert.alert(
      'Delete journal entry?',
      `"${entryContext(entry)}" permanently removes the entry from your journal.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            void remoteDeletion.mutateAsync(entry.id).catch(() => {
              Alert.alert('Could not delete entry', 'The entry is still here. Please try again.');
            }),
        },
      ],
    );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing['3xl'] + spacing['3xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === 'timeline' ? (
          <View style={styles.timelineStack}>
            <View style={styles.timelineRail} pointerEvents="none" />

            <TimelineBlock marker="current" style={styles.heroBlock}>
              <View style={styles.heroTopline}>
                <Text style={[type.labelSm, styles.timelineDate]}>
                  {formatPeriodLabel(periodMode, periodOffset, periodRange)}
                </Text>
                <Pressable
                  onPress={() => setView('trends')}
                  style={styles.headerAction}
                  accessibilityRole="button"
                  accessibilityLabel="Open journal patterns"
                >
                  <Icon name="trend" size={spacing.md} color={palette.primary} />
                  <Text style={[type.labelSm, styles.accentText]}>Patterns</Text>
                </Pressable>
              </View>
              <SectionLabel>Reflection</SectionLabel>
              <Text style={[type.displayMd, styles.heroTitle]}>Your inner weather.</Text>
            </TimelineBlock>

            <TimelineBlock marker="quiet">
              <PeriodNavigator
                mode={periodMode}
                offset={periodOffset}
                range={periodRange}
                entryCount={visibleEntries.length}
                onModeChange={(nextMode) => {
                  setPeriodMode(nextMode);
                  setPeriodOffset(0);
                }}
                onNewer={() => setPeriodOffset((value) => Math.max(0, value - 1))}
                onOlder={() => setPeriodOffset((value) => value + 1)}
              />
            </TimelineBlock>

            <TimelineBlock marker="active">
              <Card variant="featured" style={styles.composer}>
                <Text style={[type.bodyLg, styles.composerLabel]}>New note</Text>
                {selectedPrompt ? (
                  <Text style={[type.headlineMd, styles.composerPrompt]}>{selectedPrompt}</Text>
                ) : null}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.promptStrip}
                  keyboardShouldPersistTaps="handled"
                >
                  <PromptChoice
                    label="Free write"
                    selected={selectedPrompt === null}
                    onPress={() => setSelectedPrompt(null)}
                  />
                  {journalPrompts.map((prompt, index) => (
                    <PromptChoice
                      key={prompt}
                      label={promptLabel(prompt, index)}
                      selected={selectedPrompt === prompt}
                      onPress={() => setSelectedPrompt(prompt)}
                    />
                  ))}
                </ScrollView>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="A sentence is enough."
                  placeholderTextColor={palette.onSurfaceVariant}
                  multiline
                  textAlignVertical="top"
                  style={[type.bodyLg, styles.entryInput]}
                  accessibilityLabel="Journal entry"
                  accessibilityHint={selectedPrompt ?? 'Free writing'}
                />
                <MultiChoiceField
                  label="Tags"
                  value={selectedTags}
                  suggestions={moodTags}
                  onChange={setSelectedTags}
                  allowCustom
                  customPlaceholder="Add a tag"
                />
                <Pressable
                  onPress={onSave}
                  disabled={!draft.trim()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (!draft.trim() || pressed) && styles.buttonMuted,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Save journal entry"
                >
                  <Text style={[type.labelMd, styles.primaryButtonText]}>Keep this</Text>
                </Pressable>
              </Card>
            </TimelineBlock>

            {visibleEntries.map((entry) => (
              <TimelineBlock key={`${entry.source}-${entry.id}`} marker="entry">
                <TimelineEntryCard
                  entry={entry}
                  onDelete={() =>
                    entry.source === 'local'
                      ? confirmLocalDelete(entry)
                      : confirmRemoteDelete(entry)
                  }
                  deleting={
                    entry.source === 'synced' &&
                    remoteDeletion.isPending &&
                    remoteDeletion.variables === entry.id
                  }
                />
              </TimelineBlock>
            ))}

            {isLoading ? (
              <TimelineBlock marker="quiet">
                <View style={styles.loadingState}>
                  <ActivityIndicator color={palette.primary} />
                  <Text style={[type.bodySm, styles.mutedText]}>
                    Bringing your synced notes into the timeline…
                  </Text>
                </View>
              </TimelineBlock>
            ) : isError ? (
              <TimelineBlock marker="quiet">
                <Card variant="recessed">
                  <Text style={[type.bodyMd, styles.mutedText]}>
                    Your synced entries could not load. Your local notes are still here.
                  </Text>
                </Card>
              </TimelineBlock>
            ) : visibleEntries.length === 0 ? (
              <TimelineBlock marker="quiet">
                <Card variant="recessed">
                  <Text style={[type.titleMd, styles.entryTitle]}>
                    No notes in this {periodMode}.
                  </Text>
                  <Text style={[type.bodySm, styles.mutedText, styles.emptyCopy]}>
                    Move to another period, or keep one honest sentence above.
                  </Text>
                </Card>
              </TimelineBlock>
            ) : null}
          </View>
        ) : (
          <PatternsView
            entriesNeeded={entriesNeeded}
            patterns={patterns}
            onBack={() => setView('timeline')}
          />
        )}
      </ScrollView>
    </View>
  );
}

function TimelineBlock({
  marker,
  style,
  children,
}: {
  marker: 'current' | 'active' | 'entry' | 'quiet';
  style?: object;
  children: ReactNode;
}) {
  return (
    <View style={[styles.timelineBlock, style]}>
      <View
        style={[
          styles.timelineMarker,
          marker === 'current' && styles.markerCurrent,
          marker === 'active' && styles.markerActive,
          marker === 'quiet' && styles.markerQuiet,
        ]}
      />
      {children}
    </View>
  );
}

function PeriodNavigator({
  mode,
  offset,
  range,
  entryCount,
  onModeChange,
  onNewer,
  onOlder,
}: {
  mode: PeriodMode;
  offset: number;
  range: { start: Date; end: Date };
  entryCount: number;
  onModeChange: (mode: PeriodMode) => void;
  onNewer: () => void;
  onOlder: () => void;
}) {
  return (
    <View style={styles.periodNavigator}>
      <View style={styles.periodModes} accessibilityRole="radiogroup">
        {(['week', 'month'] as const).map((option) => {
          const selected = mode === option;
          return (
            <Pressable
              key={option}
              onPress={() => onModeChange(option)}
              style={[styles.periodMode, selected && styles.periodModeActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text
                numberOfLines={1}
                style={[type.labelSm, selected ? styles.promptChipTextActive : styles.mutedText]}
              >
                {option === 'week' ? 'Week' : 'Month'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.periodPager}>
        <Pressable
          onPress={onNewer}
          disabled={offset === 0}
          style={[styles.periodArrow, offset === 0 && styles.buttonMuted]}
          accessibilityRole="button"
          accessibilityLabel={`Newer ${mode}`}
        >
          <Icon name="back" size={spacing.md} color={palette.primary} />
        </Pressable>
        <View style={styles.periodSummary}>
          <Text style={[type.titleMd, styles.entryTitle]}>{formatPeriodRange(mode, range)}</Text>
          <Text style={[type.bodySm, styles.mutedText]}>
            {entryCount} {entryCount === 1 ? 'note' : 'notes'} · scroll the timeline
          </Text>
        </View>
        <Pressable
          onPress={onOlder}
          style={styles.periodArrow}
          accessibilityRole="button"
          accessibilityLabel={`Older ${mode}`}
        >
          <View style={styles.forwardIcon}>
            <Icon name="back" size={spacing.md} color={palette.primary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function PromptChoice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.promptChip, selected && styles.promptChipActive]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={[type.labelSm, selected ? styles.promptChipTextActive : styles.mutedText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function TimelineEntryCard({
  entry,
  onDelete,
  deleting,
}: {
  entry: TimelineEntry;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryDateBlock}>
          <Text style={[type.labelSm, styles.mutedText]}>{relativeDateLabel(entry.writtenAt)}</Text>
          <Text style={[type.labelSm, styles.sourceLabel]}>
            {entry.source === 'local' ? 'On this device' : 'Synced'}
          </Text>
        </View>
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          style={[styles.deleteButton, deleting && styles.buttonMuted]}
          accessibilityRole="button"
          accessibilityLabel="Delete journal entry"
        >
          <Icon name="trash" size={spacing.md} color={palette.error} />
        </Pressable>
      </View>
      {entry.title ? <Text style={[type.titleLg, styles.entryTitle]}>{entry.title}</Text> : null}
      <Text style={[type.bodyMd, styles.entryBody]}>{entry.body}</Text>
      {entry.tags.length ? (
        <View style={styles.tagRow}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={[type.labelSm, styles.mutedText]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function PatternsView({
  entriesNeeded,
  patterns,
  onBack,
}: {
  entriesNeeded: number;
  patterns: ReturnType<typeof deriveJournalPatterns>;
  onBack: () => void;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const visiblePatterns = patterns.filter((pattern) => !hidden.includes(pattern.id));
  return (
    <View style={styles.timelineStack}>
      <View style={styles.timelineRail} pointerEvents="none" />
      <TimelineBlock marker="current" style={styles.heroBlock}>
        <Pressable
          onPress={onBack}
          style={styles.backAction}
          accessibilityRole="button"
          accessibilityLabel="Return to journal timeline"
        >
          <Icon name="back" size={spacing.md} color={palette.primary} />
          <Text style={[type.labelSm, styles.accentText]}>Timeline</Text>
        </Pressable>
        <SectionLabel>Patterns, not verdicts</SectionLabel>
        <Text style={[type.displayMd, styles.heroTitle]}>What keeps returning?</Text>
        <Text style={[type.bodySm, styles.heroCopy]}>
          Mood, tags and ritual summaries become gentle patterns once enough context exists.
        </Text>
      </TimelineBlock>
      <TimelineBlock marker="active">
        <Card variant="featured" style={styles.patternCard}>
          <View style={styles.trendBars}>
            {[0.35, 0.6, 0.42, 0.76, 0.52, 0.7, 0.5].map((value, index) => (
              <View
                key={index}
                style={[
                  styles.trendBar,
                  { height: 34 + value * 74, opacity: entriesNeeded ? 0.35 : 1 },
                ]}
              />
            ))}
          </View>
          <Text style={[type.headlineSm, styles.entryTitle]}>
            {entriesNeeded
              ? `${entriesNeeded} more entries to begin`
              : `${visiblePatterns.length} observation${visiblePatterns.length === 1 ? '' : 's'} in view`}
          </Text>
          <Text style={[type.bodySm, styles.mutedText]}>
            {entriesNeeded
              ? 'Patterns wait for enough context.'
              : 'Built locally from tags, timing and entry frequency.'}
          </Text>
          <ProgressBar
            value={3 - entriesNeeded}
            max={3}
            color={palette.primary}
            style={styles.patternProgress}
          />
        </Card>
      </TimelineBlock>
      {visiblePatterns.map((pattern) => (
        <TimelineBlock key={pattern.id} marker="entry">
          <View style={styles.insightRow}>
            <Text style={[type.titleMd, styles.entryTitle]}>{pattern.title}</Text>
            <Text style={[type.bodySm, styles.mutedText]}>{pattern.detail}</Text>
            <Text style={[type.labelSm, styles.accentText]}>
              {pattern.windowLabel} · {Math.round(pattern.confidence * 100)}% confidence ·{' '}
              {pattern.evidence}
            </Text>
            <View style={styles.patternActions}>
              <Pressable
                onPress={() => setHidden((current) => [...current, pattern.id])}
                style={styles.patternAction}
                accessibilityRole="button"
              >
                <Text style={[type.labelSm, styles.mutedText]}>Hide</Text>
              </Pressable>
              <Pressable
                onPress={() => setHidden((current) => [...current, pattern.id])}
                style={styles.patternAction}
                accessibilityRole="button"
              >
                <Text style={[type.labelSm, styles.accentText]}>Not accurate</Text>
              </Pressable>
            </View>
          </View>
        </TimelineBlock>
      ))}
      <TimelineBlock marker="quiet">
        <Pressable onPress={onBack} style={styles.returnButton} accessibilityRole="button">
          <Text style={[type.labelMd, styles.entryTitle]}>Return to timeline</Text>
        </Pressable>
      </TimelineBlock>
    </View>
  );
}

function promptLabel(prompt: string, index: number) {
  if (prompt.toLowerCase().includes('body')) return 'Body';
  if (prompt.toLowerCase().includes('lighter')) return 'Lighter';
  if (prompt.toLowerCase().includes('tomorrow')) return 'Tomorrow';
  if (prompt.toLowerCase().includes('yourself')) return 'Yourself';
  return `Prompt ${index + 1}`;
}

function getPeriodRange(mode: PeriodMode, offset: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (mode === 'week') {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday - offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }
  start.setDate(1);
  start.setMonth(start.getMonth() - offset);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function formatPeriodLabel(mode: PeriodMode, offset: number, range: { start: Date; end: Date }) {
  if (offset === 0) return mode === 'week' ? 'This week' : 'This month';
  if (offset === 1) return mode === 'week' ? 'Last week' : 'Last month';
  return formatPeriodRange(mode, range);
}

function formatPeriodRange(mode: PeriodMode, range: { start: Date; end: Date }) {
  if (mode === 'month')
    return range.start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const lastDay = new Date(range.end);
  lastDay.setDate(lastDay.getDate() - 1);
  const sameMonth = range.start.getMonth() === lastDay.getMonth();
  const startLabel = range.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = lastDay.toLocaleDateString(
    undefined,
    sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' },
  );
  return `${startLabel} – ${endLabel}`;
}

function relativeDateLabel(value: string) {
  const written = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const entryDay = new Date(written);
  entryDay.setHours(0, 0, 0, 0);
  const daysAgo = Math.round((today.getTime() - entryDay.getTime()) / 86_400_000);
  if (daysAgo === 0)
    return `Today · ${written.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  if (daysAgo === 1) return 'Last night';
  return written.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  timelineStack: { position: 'relative', gap: spacing.md },
  timelineRail: {
    position: 'absolute',
    top: spacing.sm,
    bottom: 0,
    left: spacing['2xl'],
    width: 2,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHighest,
  },
  timelineBlock: { position: 'relative', marginLeft: spacing['3xl'] + spacing.md },
  timelineMarker: {
    position: 'absolute',
    left: -38,
    top: spacing.lg,
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: palette.primary,
  },
  markerCurrent: { backgroundColor: palette.surface, borderWidth: 3, borderColor: palette.primary },
  markerActive: {
    width: spacing.md,
    height: spacing.md,
    left: -40,
    top: spacing.lg,
    backgroundColor: palette.primary,
  },
  markerQuiet: {
    width: spacing.sm,
    height: spacing.sm,
    left: -36,
    backgroundColor: palette.surfaceBright,
  },
  heroBlock: { gap: spacing.xs, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  heroTopline: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  timelineDate: { color: palette.primary },
  headerAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerLow,
  },
  heroTitle: { color: palette.onSurface },
  heroCopy: { color: palette.onSurfaceVariant, maxWidth: 520 },
  accentText: { color: palette.primary },
  mutedText: { color: palette.onSurfaceVariant },
  entryTitle: { color: palette.onSurface },
  entryBody: { color: palette.onSurface, marginTop: spacing.sm },
  periodNavigator: { gap: spacing.sm },
  periodModes: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerLow,
  },
  periodMode: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  periodModeActive: { backgroundColor: palette.primary },
  periodPager: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerLow,
  },
  periodArrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHigh,
  },
  periodSummary: { flex: 1, alignItems: 'center', gap: spacing.xs },
  forwardIcon: { transform: [{ rotate: '180deg' }] },
  composer: { gap: spacing.md },
  composerLabel: { color: palette.onSurfaceVariant },
  composerPrompt: { color: palette.onSurface },
  promptStrip: { gap: spacing.sm, paddingRight: spacing.md },
  promptChip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHighest,
  },
  promptChipActive: { backgroundColor: palette.primary },
  promptChipTextActive: { color: palette.onPrimary },
  entryInput: {
    minHeight: 136,
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: palette.primary,
  },
  primaryButtonText: { color: palette.onPrimary },
  buttonMuted: { opacity: 0.42 },
  entryCard: { gap: spacing.xs },
  entryHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  entryDateBlock: { flex: 1, gap: spacing.xs },
  sourceLabel: { color: palette.primary },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerLowest,
  },
  emptyCopy: { marginTop: spacing.xs },
  loadingState: { minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  backAction: {
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerLow,
    marginBottom: spacing.sm,
  },
  patternCard: { gap: spacing.sm },
  trendBars: {
    height: 132,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerLow,
  },
  trendBar: {
    width: 22,
    borderTopLeftRadius: radii.pill,
    borderTopRightRadius: radii.pill,
    backgroundColor: palette.primary,
  },
  patternProgress: { marginTop: spacing.sm },
  insightRow: {
    minHeight: 72,
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerLow,
  },
  patternActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  patternAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHigh,
  },
  returnButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
  },
});
