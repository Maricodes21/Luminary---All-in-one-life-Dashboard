import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SpotifyDailyRecap } from '@/components/spotify/SpotifyDailyRecap';
import { JournalStep } from '@/components/ritual/JournalStep';
import { HabitCheckin } from '@/components/ritual/HabitCheckin';
import { useSpotifyRecap } from '@/hooks/useSpotifyRecap';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { useWallet } from '@/hooks/useWallet';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';
import { useProductionStore, type Habit } from '@/stores/useProductionStore';
import { useRitualStore, type RitualStage } from '@/stores/useRitualStore';
import { useSignalStore } from '@/stores/useSignalStore';
import { generateDailySignals, type DailySignal } from '@/lib/dailySignals';
import { localDateKey } from '@/lib/meals/dates';
import { activeHabitsForDate, nextLocalDate } from '@/lib/habits';
import { moodCopy, type MoodLabel } from '@/lib/mood';
import { estimateMoodLocally, type MoodEstimate } from '@/lib/moodEstimation';
import { writeDailyRitualSession, writeMoodEvent, writeSpotifySnapshot } from '@/lib/ritual';

export default function RitualScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = localDateKey(new Date());
  const stage = useRitualStore((state) => state.stage);
  const session = useRitualStore((state) => state.session);
  const hydrated = useRitualStore((state) => state.hasHydrated);
  const ensureSession = useRitualStore((state) => state.ensureSession);
  const beginSession = useRitualStore((state) => state.beginSession);
  const setStage = useRitualStore((state) => state.setStage);
  const markMoodSkipped = useRitualStore((state) => state.markMoodSkipped);
  const completeSession = useRitualStore((state) => state.completeSession);
  const habitsCompleted = useRitualStore((state) => state.habitsCompleted);
  const totalHabits = useRitualStore((state) => state.totalHabits);
  const mealsUser = useMealsStore(activeMealsUser);
  const allHabits = useProductionStore((state) => state.habits);
  const expenses = useProductionStore((state) => state.expenses);
  const expensePrompts = useProductionStore((state) => state.expensePrompts);
  const journalEntries = useProductionStore((state) => state.journalEntries);
  const workoutPlans = useProductionStore((state) => state.workoutPlans);
  const workoutLogs = useProductionStore((state) => state.workoutLogs);
  const endHabit = useProductionStore((state) => state.endHabit);
  const interactions = useSignalStore((state) => state.interactions);
  const recordSignal = useSignalStore((state) => state.record);
  const { transactions } = useWallet();
  const { workouts } = useHealthMetrics();
  const { recap, isLoading, error, retry } = useSpotifyRecap();

  const [now, setNow] = useState(() => new Date());
  const habits = useMemo(() => activeHabitsForDate(allHabits, today), [allHabits, today]);
  const todayMeals = useMemo(() => mealsUser?.meals.filter((meal) => meal.localDate === today) ?? [], [mealsUser?.meals, today]);
  const purchaseCount = expenses.filter((expense) => expense.transactionDate === today).length + transactions.filter((transaction) => transaction.transaction_date === today).length;
  const localWorkout = workoutLogs.find((workout) => workout.workoutDate === today);
  const remoteWorkout = workouts.find((workout) => workout.workout_date === today);
  const latestPlan = workoutPlans[0];
  const workoutCompleted = Boolean(localWorkout || remoteWorkout);
  const todayJournalEntries = journalEntries.filter((entry) => !entry.deletedAt && localDateKey(new Date(entry.writtenAt)) === today);
  const plannedMeals = useMemo(() => mealsUser?.plans.flatMap((plan) => plan.entries).filter((entry) => entry.localDate === today) ?? [], [mealsUser?.plans, today]);

  const signals = useMemo(() => generateDailySignals({
    now,
    habits,
    loggedMealTypes: todayMeals.map((meal) => meal.mealType),
    plannedMeals,
    purchaseCount,
    pendingExpenseCount: expensePrompts.filter((prompt) => prompt.status === 'pending').length,
    workout: {
      planned: Boolean(latestPlan),
      completed: workoutCompleted,
      title: localWorkout?.title ?? latestPlan?.sessions?.[0]?.title,
    },
    journal: { entryCount: todayJournalEntries.length, recentTags: journalEntries.flatMap((entry) => entry.tags).slice(0, 6) },
    ritual: { status: session.status },
    music: { connected: recap !== undefined, recapAvailable: Boolean(recap) },
  }, interactions), [expensePrompts, habits, interactions, journalEntries, latestPlan, localWorkout?.title, now, plannedMeals, purchaseCount, recap, session.status, todayJournalEntries.length, todayMeals, workoutCompleted]);

  // Regeneration above revalidates an interrupted session. Resolved cards disappear
  // even if their earlier IDs were persisted with the ritual.
  const selectedSignals = session.selectedSignalIds.length
    ? signals.filter((signal) => session.selectedSignalIds.includes(signal.id))
    : signals;
  const contextualSignals = selectedSignals.filter((signal) => ['meals', 'health', 'money'].includes(signal.source));
  const moodEstimate = useMemo(() => estimateMoodLocally({
    confirmedMoodHistory: [],
    journal: { tags: journalEntries.flatMap((entry) => entry.tags).slice(0, 8), entryCount: journalEntries.length },
    commitments: { completed: habits.filter((habit) => habit.completedOn.includes(today)).length, scheduled: habits.length },
    movement: { workoutCompleted, steps: remoteWorkout ? undefined : undefined },
    meals: { loggedMealCount: todayMeals.length },
    ritual: { recentCompletionRate: session.status === 'completed' ? 1 : 0 },
    localHour: now.getHours(),
  }), [habits, journalEntries, now, remoteWorkout, session.status, today, todayMeals.length, workoutCompleted]);

  useEffect(() => { setNow(new Date()); }, [stage]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') setNow(new Date()); });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (hydrated) ensureSession(today);
  }, [ensureSession, hydrated, today]);

  useEffect(() => {
    if (!hydrated || session.localDate !== today || session.status === 'not_started') return;
    const timeout = setTimeout(() => { void writeDailyRitualSession(session); }, 300);
    return () => clearTimeout(timeout);
  }, [hydrated, session, today]);

  useEffect(() => {
    if (stage === 'summary') router.replace('/ritual/summary');
  }, [router, stage]);

  function summary() {
    return {
      habitsCompleted: habitsCompleted.length,
      totalHabits,
      movementMinutes: localWorkout?.durationMinutes ?? remoteWorkout?.duration_minutes ?? 0,
      musicMinutes: recap?.minutesListened ?? 0,
      tomorrowCue: habits.find((habit) => !habit.completedOn.includes(today))?.name ?? 'Begin with one small promise',
    };
  }

  function finishTonight() {
    completeSession(summary());
    void writeDailyRitualSession(useRitualStore.getState().session);
  }

  function finishAndOpen(signal: DailySignal) {
    recordSignal(signal, 'actioned');
    completeSession(summary());
    void writeDailyRitualSession(useRitualStore.getState().session);
    router.dismissAll();
    router.replace(signal.route as never);
  }

  function goBack() {
    const previous: Partial<Record<RitualStage, RitualStage>> = {
      music: 'entry', mood: 'music', journal: session.mood ? 'mood' : 'mood', habits: session.moodSkipped ? 'mood' : 'journal',
      tomorrow: 'habits', context: 'tomorrow',
    };
    const target = previous[stage];
    if (target) setStage(target);
    else router.back();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing['2xl'] }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {stage === 'entry' ? <EntryStep signalCount={contextualSignals.length} onBack={goBack} onBegin={() => beginSession(today, contextualSignals.map((signal) => signal.id))} /> : null}
        {stage === 'music' ? <MusicStep recap={recap} loading={isLoading} error={error} retry={retry} onBack={goBack} onContinue={() => setStage('mood')} /> : null}
        {stage === 'mood' ? <MoodStep estimate={moodEstimate} recap={recap} onBack={goBack} onSkip={() => { markMoodSkipped(); setStage('habits'); }} /> : null}
        {stage === 'journal' ? <View style={styles.stage}><RitualHeading eyebrow="Optional · journal" title="Want to keep a little more?" description="Add one thought directly to Journal, or leave it here." onBack={goBack} /><JournalStep /></View> : null}
        {stage === 'habits' ? <View style={styles.stage}><RitualHeading eyebrow="Next · commitments" title="How did your commitments go?" description="Count what happened or skip only this day." onBack={goBack} /><HabitCheckin /></View> : null}
        {stage === 'tomorrow' ? <TomorrowStep habits={activeHabitsForDate(allHabits, nextLocalDate(today))} onBack={goBack} onDelete={(habit) => confirmFutureRemoval(habit, nextLocalDate(today), endHabit)} onSubstitute={(habit) => router.push({ pathname: '/habits/new', params: { replaceId: habit.id, effectiveDate: nextLocalDate(today) } })} onContinue={() => setStage('context')} /> : null}
        {stage === 'context' ? <ContextStep signals={contextualSignals} onBack={goBack} onFinish={finishTonight} onOpen={finishAndOpen} /> : null}
      </ScrollView>
    </View>
  );
}

function EntryStep({ signalCount, onBack, onBegin }: { signalCount: number; onBack: () => void; onBegin: () => void }) {
  return <View style={styles.stage}>
    <RitualHeading eyebrow="Tonight · about 75 seconds" title="A quick look back." description="Music, how the day felt, your commitments and tomorrow." onBack={onBack} />
    <Card variant="recessed" style={styles.previewCard}>
      <View style={styles.timeOrbit}><Text style={[type.displaySm, styles.timeValue]}>75</Text><Text style={[type.labelSm, styles.timeLabel]}>seconds, roughly</Text></View>
      <View style={styles.previewList}><PreviewLine number="01" label="Listening recap" /><PreviewLine number="02" label="Mood + commitments" /><PreviewLine number="03" label="Plan tomorrow" /></View>
    </Card>
    <Text style={[type.bodySm, styles.centerNote]}>{signalCount ? `${signalCount} optional check-in${signalCount === 1 ? '' : 's'} will appear at the end. Every one can be skipped.` : 'There are no extra check-ins tonight.'}</Text>
    <PrimaryButton label="Begin with your music" onPress={onBegin} />
  </View>;
}

function PreviewLine({ number, label }: { number: string; label: string }) {
  return <View style={styles.previewLine}><Text style={[type.labelSm, styles.accentText]}>{number}</Text><Text style={[type.titleMd, styles.title]}>{label}</Text></View>;
}

function MusicStep({ recap, loading, error, retry, onBack, onContinue }: {
  recap: ReturnType<typeof useSpotifyRecap>['recap']; loading: boolean; error: string | null; retry: () => void; onBack: () => void; onContinue: () => void;
}) {
  async function continueFromMusic() {
    if (recap) await writeSpotifySnapshot({ recap });
    onContinue();
  }
  return <View style={styles.stage}>
    <RitualHeading eyebrow="First · listening" title="What stayed in rotation?" description="Spotify shows what you played. It does not decide how you felt." onBack={onBack} />
    {loading ? <View style={styles.loading}><ActivityIndicator color={palette.primary} /><Text style={[type.bodySm, styles.copy]}>Gathering today’s listening…</Text></View> : null}
    {!loading && recap ? <SpotifyDailyRecap recap={recap} /> : null}
    {!loading && !recap ? <Card variant="recessed" style={styles.emptyCard}><Icon name="sparkles" size={32} color={palette.primary} /><Text style={[type.headlineSm, styles.title]}>No listening recap today.</Text><Text style={[type.bodySm, styles.copy]}>That is fine. Your ritual continues without guessing what the silence means.</Text>{error ? <SecondaryButton label="Try Spotify again" onPress={retry} /> : null}</Card> : null}
    <PrimaryButton label="Continue to how today felt" onPress={() => { void continueFromMusic(); }} disabled={loading} />
  </View>;
}

function MoodStep({ estimate, recap, onBack, onSkip }: { estimate: MoodEstimate | null; recap: ReturnType<typeof useSpotifyRecap>['recap']; onBack: () => void; onSkip: () => void }) {
  const [choosing, setChoosing] = useState(!estimate);
  const [selected, setSelected] = useState<MoodLabel | null>(null);
  const [saving, setSaving] = useState(false);
  const setMood = useRitualStore((state) => state.setMood);
  const setMoodEventId = useRitualStore((state) => state.setMoodEventId);
  const setStage = useRitualStore((state) => state.setStage);

  async function saveMood(label: MoodLabel, source: 'manual' | 'luminary_local', confidence: number) {
    setSaving(true);
    try {
      const id = await writeMoodEvent({ label, source, confidence });
      setMood({ label, source, confidence });
      setMoodEventId(id);
      setStage('journal');
    } finally { setSaving(false); }
  }

  if (choosing || !estimate) return <View style={styles.stage}>
    <RitualHeading eyebrow="Your read comes first" title="How did today actually feel?" description="Choose the closest word, or skip this part." onBack={onBack} />
    <View style={styles.moodGrid}>{MANUAL_MOODS.map((label) => <Pressable key={label} onPress={() => setSelected(label)} style={[styles.moodChip, selected === label && styles.moodChipSelected]} accessibilityRole="radio" accessibilityState={{ selected: selected === label }}><Text style={[type.labelMd, selected === label ? styles.accentText : styles.title]}>{moodCopy[label].display}</Text></Pressable>)}</View>
    <PrimaryButton label={saving ? 'Saving…' : 'Use this mood'} onPress={() => selected && void saveMood(selected, 'manual', 1)} disabled={!selected || saving} />
    <TextButton label="Skip mood tonight" onPress={onSkip} />
  </View>;

  return <View style={styles.stage}>
    <RitualHeading eyebrow="Next · your day" title={`Did today feel ${moodCopy[estimate.label].display.toLowerCase()}?`} description="This suggestion uses Luminary signals you allowed—not Spotify listening." onBack={onBack} />
    <Card variant="featured" style={styles.moodCard}>
      <SectionLabel>Luminary’s estimate</SectionLabel>
      <Text style={[type.displayMd, styles.musicMood]}>{moodCopy[estimate.label].display}</Text>
      <Text style={[type.bodyMd, styles.copy]}>{estimate.explanation}</Text>
      <View style={styles.evidenceStrip}><Text style={[type.labelSm, styles.evidenceLabel]}>Why this came up</Text><Text style={[type.bodySm, styles.evidenceCopy]}>{estimate.contributingFamilies.map(humanFamily).join(' · ')}</Text></View>
      {recap ? <Text style={[type.labelSm, styles.copy]}>Spotify recap shown separately: {recap.minutesListened} minutes · {recap.trackCount} plays.</Text> : null}
    </Card>
    <PrimaryButton label={saving ? 'Saving…' : 'That’s about right.'} onPress={() => void saveMood(estimate.label, 'luminary_local', estimate.confidence)} disabled={saving} />
    <SecondaryButton label="Not quite right." onPress={() => setChoosing(true)} />
    <TextButton label="Skip mood tonight" onPress={onSkip} />
  </View>;
}

const MANUAL_MOODS: MoodLabel[] = ['energized', 'joyful', 'focused', 'hopeful', 'reflective', 'curious', 'peaceful', 'grounded', 'tender', 'cloudy', 'restless', 'anxious', 'wired', 'melancholic', 'drained'];

function TomorrowStep({ habits, onBack, onDelete, onSubstitute, onContinue }: { habits: Habit[]; onBack: () => void; onDelete: (habit: Habit) => void; onSubstitute: (habit: Habit) => void; onContinue: () => void }) {
  return <View style={styles.stage}>
    <RitualHeading eyebrow="Then · tomorrow" title="What should stay with you?" description="Keep what fits, remove it from future days, or choose a substitute." onBack={onBack} />
    <View style={styles.tomorrowList}>{habits.map((habit) => <View key={habit.id} style={styles.tomorrowRow}><View style={styles.tomorrowName}><Text style={[type.titleMd, styles.title]}>{habit.name}</Text><Text style={[type.labelSm, styles.copy]}>{habit.category ?? 'Personal'} · {habit.schedule?.timeWindow ?? 'anytime'}</Text></View><Pressable onPress={() => onSubstitute(habit)} style={styles.smallAction}><Text style={[type.labelSm, styles.accentText]}>Substitute</Text></Pressable><Pressable onPress={() => onDelete(habit)} style={styles.smallAction}><Text style={[type.labelSm, styles.error]}>Delete</Text></Pressable></View>)}</View>
    <PrimaryButton label="Continue" onPress={onContinue} />
  </View>;
}

function ContextStep({ signals, onBack, onFinish, onOpen }: { signals: DailySignal[]; onBack: () => void; onFinish: () => void; onOpen: (signal: DailySignal) => void }) {
  return <View style={styles.stage}>
    <RitualHeading eyebrow="Last · optional" title="Anything else before tomorrow?" description="Open one now, or finish the night. Neither choice leaves the ritual hanging." onBack={onBack} />
    {signals.length ? <View style={styles.signalList}>{signals.map((signal) => <SignalCard key={signal.id} signal={signal} onPress={() => onOpen(signal)} />)}</View> : <Card variant="recessed" style={styles.emptyCard}><Text style={[type.headlineSm, styles.title]}>Nothing else needs your attention.</Text><Text style={[type.bodySm, styles.copy]}>Your day is ready to close.</Text></Card>}
    <PrimaryButton label="Finish tonight" onPress={onFinish} />
  </View>;
}

function SignalCard({ signal, onPress }: { signal: DailySignal; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.signalCard, pressed && styles.pressed]} accessibilityRole="button"><View style={styles.signalIcon}><Icon name={signalIcon(signal.source)} size={spacing.md} color={palette.primary} /></View><View style={styles.signalBody}><Text style={[type.labelSm, styles.copy]}>{signal.source}</Text><Text style={[type.titleMd, styles.title]}>{signal.title}</Text><Text style={[type.bodySm, styles.copy]}>{signal.detail}</Text><Text style={[type.labelSm, styles.accentText]}>{signal.action} →</Text></View></Pressable>;
}

function RitualHeading({ eyebrow, title, description, onBack }: { eyebrow: string; title: string; description: string; onBack: () => void }) {
  return <View style={styles.heading}><Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Go back"><Icon name="back" size={spacing.lg} color={palette.onSurface} /></Pressable><View style={styles.headingCopy}><Text style={[type.labelSm, styles.overline]}>{eyebrow}</Text><Text style={[type.displaySm, styles.headingTitle]}>{title}</Text><Text style={[type.bodyMd, styles.headingDescription]}>{description}</Text></View></View>;
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, (pressed || disabled) && styles.disabled]} accessibilityRole="button"><Text style={[type.labelMd, styles.primaryText]}>{label}</Text></Pressable>; }
function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={[type.labelMd, styles.title]}>{label}</Text></Pressable>; }
function TextButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={[type.labelMd, styles.accentText]}>{label}</Text></Pressable>; }

function confirmFutureRemoval(habit: Habit, effectiveDate: string, endHabit: (id: string, date: string) => void) {
  Alert.alert('Delete from future days?', `${habit.name} will leave your schedule from tomorrow. Earlier days and completion history stay intact.`, [{ text: 'Keep it', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => endHabit(habit.id, effectiveDate) }]);
}

function signalIcon(source: DailySignal['source']): IconName {
  if (source === 'meals') return 'meals'; if (source === 'money') return 'money'; if (source === 'journal') return 'journal'; if (source === 'music') return 'sparkles'; if (source === 'commitments') return 'check'; return 'health';
}

function humanFamily(value: MoodEstimate['contributingFamilies'][number]) {
  return ({ confirmed_mood: 'moods you confirmed', journal: 'journal tags', commitments: 'commitments', movement: 'movement', meals: 'meal timing', ritual: 'ritual rhythm', time: 'time of day' } as const)[value];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface }, scroll: { padding: spacing.md }, stage: { gap: spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md }, backButton: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerLow }, headingCopy: { flex: 1, gap: spacing.xs }, overline: { color: palette.primary }, headingTitle: { color: palette.onSurface }, headingDescription: { color: palette.onSurfaceVariant },
  title: { color: palette.onSurface }, copy: { color: palette.onSurfaceVariant }, accentText: { color: palette.primary }, error: { color: palette.error }, pressed: { opacity: .74 }, disabled: { opacity: .48 },
  previewCard: { minHeight: 160, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, timeOrbit: { width: 120, height: 120, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainer }, timeValue: { color: palette.onSurface }, timeLabel: { color: palette.primary, textAlign: 'center' }, previewList: { flex: 1, gap: spacing.md }, previewLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, centerNote: { color: palette.onSurfaceVariant, textAlign: 'center', padding: spacing.sm },
  loading: { minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: spacing.md }, emptyCard: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  moodCard: { minHeight: 300, justifyContent: 'center', gap: spacing.md }, musicMood: { color: palette.primary }, evidenceStrip: { padding: spacing.md, backgroundColor: palette.surfaceContainerHighest, borderLeftWidth: 4, borderLeftColor: palette.primary }, evidenceLabel: { color: palette.onSurfaceVariant }, evidenceCopy: { color: palette.onSurface, marginTop: spacing.xs }, moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, moodChip: { minWidth: '30%', flexGrow: 1, minHeight: 48, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerLow }, moodChipSelected: { backgroundColor: palette.primaryContainer },
  tomorrowList: { gap: spacing.sm }, tomorrowRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow }, tomorrowName: { flex: 1, gap: spacing.xs }, smallAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs },
  signalList: { gap: spacing.sm }, signalCard: { minHeight: 104, borderRadius: radii.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceContainerLow }, signalIcon: { width: 44, height: 44, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest }, signalBody: { flex: 1, gap: spacing.xs },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, paddingHorizontal: spacing.md, backgroundColor: palette.primary }, primaryText: { color: palette.onPrimary }, secondaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, paddingHorizontal: spacing.sm, backgroundColor: palette.surfaceContainerLow }, textButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
