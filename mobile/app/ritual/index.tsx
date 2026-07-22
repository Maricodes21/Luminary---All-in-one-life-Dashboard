import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { MoodChipGrid } from '@/components/ritual/MoodChipGrid';
import { RecapCard } from '@/components/ritual/RecapCard';
import { JournalStep } from '@/components/ritual/JournalStep';
import { HabitCheckin } from '@/components/ritual/HabitCheckin';
import { useSpotifyRecap } from '@/hooks/useSpotifyRecap';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { useWallet } from '@/hooks/useWallet';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';
import { useProductionStore } from '@/stores/useProductionStore';
import { useRitualStore, type RitualStage } from '@/stores/useRitualStore';
import { buildMusicEvidence, selectDailyRitualSignals, type RitualSignal } from '@/lib/dailyRitual';
import { localDateKey } from '@/lib/meals/dates';
import { mapAudioFeaturesToMood, moodCopy, type MoodLabel } from '@/lib/mood';
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
  const expenses = useProductionStore((state) => state.expenses);
  const workoutPlans = useProductionStore((state) => state.workoutPlans);
  const workoutLogs = useProductionStore((state) => state.workoutLogs);
  const habits = useProductionStore((state) => state.habits.filter((habit) => !habit.archivedAt));
  const toggleHabitPause = useProductionStore((state) => state.toggleHabitPause);
  const { transactions } = useWallet();
  const { workouts } = useHealthMetrics();
  const { recap, isLoading, error, retry } = useSpotifyRecap();

  const todayMeals = useMemo(
    () => mealsUser?.meals.filter((meal) => meal.localDate === today) ?? [],
    [mealsUser?.meals, today],
  );
  const purchaseCount = expenses.filter((expense) => expense.transactionDate === today).length + transactions.filter((transaction) => transaction.transaction_date === today).length;
  const localWorkout = workoutLogs.find((workout) => workout.workoutDate === today);
  const remoteWorkout = workouts.find((workout) => workout.workout_date === today);
  const latestPlan = workoutPlans[0];
  const workoutCompleted = Boolean(localWorkout || remoteWorkout);
  const signals = useMemo(() => selectDailyRitualSignals({
    now: new Date(),
    loggedMealTypes: todayMeals.map((meal) => meal.mealType),
    purchaseCount,
    workoutPlanned: Boolean(latestPlan),
    workoutCompleted,
    workoutLabel: latestPlan ? `${sentenceCase(latestPlan.category)} · ${latestPlan.level}` : undefined,
  }), [latestPlan, purchaseCount, todayMeals, workoutCompleted]);
  const selectedSignals = session.selectedSignalIds.length
    ? signals.filter((signal) => session.selectedSignalIds.includes(signal.id))
    : signals;

  useEffect(() => {
    if (hydrated) ensureSession(today);
  }, [ensureSession, hydrated, today]);

  useEffect(() => {
    if (!hydrated || session.localDate !== today || session.status === 'not_started') return;
    const timeout = setTimeout(() => { void writeDailyRitualSession(session); }, 300);
    return () => clearTimeout(timeout);
  }, [hydrated, session, today]);

  useEffect(() => {
    if (stage === 'summary') router.push('/ritual/summary');
  }, [router, stage]);

  function close() {
    router.back();
  }

  function finishTomorrow() {
    const tomorrowCue = habits.find((habit) => !habit.completedOn.includes(today))?.name ?? 'Begin with one small promise';
    const summary = {
      habitsCompleted: habitsCompleted.length,
      totalHabits,
      movementMinutes: localWorkout?.durationMinutes ?? remoteWorkout?.duration_minutes ?? 0,
      musicMinutes: recap?.minutesListened ?? 0,
      tomorrowCue,
    };
    completeSession(summary);
    const nextSession = useRitualStore.getState().session;
    void writeDailyRitualSession(nextSession);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Pressable onPress={close} style={styles.topbarButton} accessibilityRole="button" accessibilityLabel="Close ritual"><Icon name="close" size={20} color={palette.onSurfaceVariant} /></Pressable>
        <View style={styles.topbarTitle}><SectionLabel>Tonight’s ritual</SectionLabel><Text style={[type.labelSm, styles.step]}>{stageLabel(stage)}</Text></View>
        <View style={styles.topbarButton}><Icon name="clock" size={17} color={palette.primary} /></View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {stage === 'entry' ? <EntryStep signals={selectedSignals} onBegin={() => beginSession(today, selectedSignals.map((signal) => signal.id))} /> : null}
        {stage === 'music' ? (
          <MusicStep
            recap={recap}
            loading={isLoading}
            error={error}
            retry={retry}
            onChooseMood={() => setStage('mood')}
            onSkip={() => { markMoodSkipped(); setStage('habits'); }}
          />
        ) : null}
        {stage === 'mood' ? <ManualMoodStep onSkip={() => { markMoodSkipped(); setStage('habits'); }} /> : null}
        {stage === 'journal' ? <JournalStep /> : null}
        {stage === 'habits' ? <HabitCheckin /> : null}
        {stage === 'context' ? <ContextStep signals={selectedSignals} onContinue={() => setStage('tomorrow')} onOpen={(signal) => router.replace(signal.route)} /> : null}
        {stage === 'tomorrow' ? <TomorrowStep habits={habits} onTogglePause={toggleHabitPause} onFinish={finishTomorrow} /> : null}
      </ScrollView>
    </View>
  );
}

function EntryStep({ signals, onBegin }: { signals: RitualSignal[]; onBegin: () => void }) {
  return (
    <View style={styles.stage}>
      <View style={styles.ritualHeroIcon}><Icon name="sparkles" size={24} color={palette.onPrimary} /></View>
      <SectionLabel>About 75 seconds</SectionLabel>
      <Text style={[type.displaySm, styles.title]}>A soft landing for the day.</Text>
      <Text style={[type.bodyMd, styles.copy]}>Music, mood and commitments make up the core. Everything else is optional.</Text>
      <Card>
        <StepLine icon="sparkles" title="Music and mood" detail="Your listening offers a suggestion, never a verdict." />
        <StepLine icon="journal" title="One honest line" detail="Add it to Journal, or skip it." />
        <StepLine icon="check" title="Commitments" detail="Reconcile today and shape tomorrow." />
      </Card>
      {signals.length ? <Card variant="recessed"><SectionLabel>Optional tonight</SectionLabel><Text style={[type.bodySm, styles.optionalIntro]}>{signals.map((signal) => signal.title).join(' · ')}</Text></Card> : null}
      <PrimaryButton label="Begin with music" onPress={onBegin} />
    </View>
  );
}

function MusicStep({ recap, loading, error, retry, onChooseMood, onSkip }: {
  recap: ReturnType<typeof useSpotifyRecap>['recap']; loading: boolean; error: string | null; retry: () => void; onChooseMood: () => void; onSkip: () => void;
}) {
  const setMood = useRitualStore((state) => state.setMood);
  const setMoodEventId = useRitualStore((state) => state.setMoodEventId);
  const setStage = useRitualStore((state) => state.setStage);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) return <View style={styles.loading}><ActivityIndicator color={palette.primary} size="large" /><Text style={[type.bodyMd, styles.copy]}>Reading today’s soundtrack…</Text></View>;

  if (!recap) {
    return (
      <View style={styles.stage}>
        <SectionLabel>Music</SectionLabel><Text style={[type.displaySm, styles.title]}>No soundtrack arrived tonight.</Text>
        <Text style={[type.bodyMd, styles.copy]}>{error ?? 'That is okay. You can choose your mood yourself or move on.'}</Text>
        {error ? <PrimaryButton label="Try Spotify again" onPress={retry} /> : null}
        <PrimaryButton label="Choose how I feel" onPress={onChooseMood} />
        <TertiaryButton label="Skip mood tonight" onPress={onSkip} />
      </View>
    );
  }

  const musicRecap = recap;
  const estimate = mapAudioFeaturesToMood(musicRecap.averageFeatures);
  const evidence = buildMusicEvidence(musicRecap);

  async function accept() {
    setSaving(true); setSaveError(null);
    try {
      const [eventId] = await Promise.all([
        writeMoodEvent({ label: estimate.label, source: 'spotify', confidence: estimate.confidence, features: musicRecap.averageFeatures }),
        writeSpotifySnapshot({ recap: musicRecap, estimatedMood: estimate.label, estimatedConfidence: estimate.confidence }),
      ]);
      setMood({ label: estimate.label, source: 'spotify', confidence: estimate.confidence });
      setMoodEventId(eventId);
      setStage('journal');
    } catch { setSaveError('That did not save yet. Try once more.'); }
    finally { setSaving(false); }
  }

  return (
    <View style={styles.stage}>
      <SectionLabel>Your soundtrack</SectionLabel>
      <Text style={[type.displaySm, styles.title]}>Here’s how today sounded.</Text>
      <RecapCard recap={musicRecap} />
      <Card variant="featured">
        <SectionLabel>Mood suggestion</SectionLabel>
        <Text style={[type.headlineLg, styles.moodTitle]}>{moodCopy[estimate.label].display}</Text>
        <Text style={[type.bodySm, styles.copy]}>Does this feel close to how your day actually felt?</Text>
      </Card>
      <Card variant="recessed">
        <SectionLabel>Why this came up</SectionLabel>
        <View style={styles.evidenceList}>{evidence.map((item) => <View key={item} style={styles.evidenceRow}><View style={styles.evidenceDot} /><Text style={[type.bodySm, styles.copy]}>{item}</Text></View>)}</View>
      </Card>
      {saveError ? <Text style={[type.bodySm, styles.error]}>{saveError}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Yes, this feels right'} onPress={accept} disabled={saving} />
      <TertiaryButton label="Choose a different mood" onPress={onChooseMood} />
      <TertiaryButton label="Skip mood tonight" onPress={onSkip} />
    </View>
  );
}

function ManualMoodStep({ onSkip }: { onSkip: () => void }) {
  const [selected, setSelected] = useState<MoodLabel | null>(null);
  const [saving, setSaving] = useState(false);
  const setMood = useRitualStore((state) => state.setMood);
  const setMoodEventId = useRitualStore((state) => state.setMoodEventId);
  const setStage = useRitualStore((state) => state.setStage);

  async function save() {
    if (!selected) return;
    setSaving(true);
    const id = await writeMoodEvent({ label: selected, source: 'manual', confidence: 1 });
    setMood({ label: selected, source: 'manual', confidence: 1 });
    setMoodEventId(id);
    setSaving(false);
    setStage('journal');
  }

  return (
    <View style={styles.stage}>
      <SectionLabel>Mood</SectionLabel><Text style={[type.displaySm, styles.title]}>How did today really feel?</Text>
      <Text style={[type.bodyMd, styles.copy]}>Pick the closest word. You can add the nuance to Journal next.</Text>
      <MoodChipGrid selected={selected} onSelect={setSelected} />
      <PrimaryButton label={saving ? 'Saving…' : 'Use this mood'} onPress={save} disabled={!selected || saving} />
      <TertiaryButton label="Skip mood tonight" onPress={onSkip} />
    </View>
  );
}

function ContextStep({ signals, onContinue, onOpen }: { signals: RitualSignal[]; onContinue: () => void; onOpen: (signal: RitualSignal) => void }) {
  return (
    <View style={styles.stage}>
      <SectionLabel>Optional tonight</SectionLabel><Text style={[type.displaySm, styles.title]}>{signals.length ? 'Anything still open?' : 'Your essentials are covered.'}</Text>
      <Text style={[type.bodyMd, styles.copy]}>{signals.length ? 'These come from unfinished areas of today. Open one now, or leave all of them for tomorrow.' : 'There are no extra check-ins asking for your attention.'}</Text>
      <View style={styles.signalList}>{signals.map((signal) => <Pressable key={signal.id} onPress={() => onOpen(signal)} style={({ pressed }) => [styles.signalCard, pressed && styles.pressed]} accessibilityRole="button"><View style={styles.signalIcon}><Icon name={signalIcon(signal.kind)} size={20} color={palette.onPrimary} /></View><View style={styles.signalBody}><Text style={[type.titleMd, styles.title]}>{signal.title}</Text><Text style={[type.bodySm, styles.copy]}>{signal.detail}</Text></View><Text style={[type.labelSm, styles.signalAction]}>{signal.action}</Text></Pressable>)}</View>
      <PrimaryButton label={signals.length ? 'Leave these for tomorrow' : 'Plan tomorrow'} onPress={onContinue} />
    </View>
  );
}

function TomorrowStep({ habits, onTogglePause, onFinish }: {
  habits: { id: string; name: string; pausedOn?: string[] }[];
  onTogglePause: (id: string, date: string) => void;
  onFinish: () => void;
}) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const tomorrowKey = localDateKey(tomorrow);
  return (
    <View style={styles.stage}>
      <SectionLabel>Tomorrow</SectionLabel><Text style={[type.displaySm, styles.title]}>Make room before morning.</Text>
      <Text style={[type.bodyMd, styles.copy]}>Keep each commitment active, or pause it intentionally for tomorrow.</Text>
      <Card>{habits.map((habit) => {
        const paused = habit.pausedOn?.includes(tomorrowKey) ?? false;
        return <Pressable key={habit.id} onPress={() => onTogglePause(habit.id, tomorrowKey)} style={styles.tomorrowRow} accessibilityRole="switch" accessibilityState={{ checked: !paused }}><View style={styles.tomorrowCopy}><Text style={[type.titleMd, styles.title]}>{habit.name}</Text><Text style={[type.bodySm, styles.copy]}>{paused ? 'Paused for tomorrow' : 'Active tomorrow'}</Text></View><View style={[styles.pausePill, paused && styles.pausePillActive]}><Text style={[type.labelSm, { color: paused ? palette.secondary : palette.tertiaryDim }]}>{paused ? 'Paused' : 'Keep'}</Text></View></Pressable>;
      })}</Card>
      <PrimaryButton label="Finish tonight" onPress={onFinish} />
    </View>
  );
}

function StepLine({ icon, title, detail }: { icon: IconName; title: string; detail: string }) { return <View style={styles.stepLine}><View style={styles.stepIcon}><Icon name={icon} size={17} color={palette.primary} /></View><View style={styles.stepBody}><Text style={[type.titleMd, styles.title]}>{title}</Text><Text style={[type.bodySm, styles.copy]}>{detail}</Text></View></View>; }
function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, (pressed || disabled) && styles.disabled]} accessibilityRole="button"><Text style={[type.labelMd, styles.primaryText]}>{label}</Text><Icon name="sparkles" size={16} color={palette.onPrimary} /></Pressable>; }
function TertiaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.tertiaryButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={[type.labelMd, styles.tertiaryText]}>{label}</Text></Pressable>; }
function signalIcon(kind: RitualSignal['kind']): IconName { if (kind === 'meals') return 'meals'; if (kind === 'money') return 'money'; return 'health'; }
function sentenceCase(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
function stageLabel(stage: RitualStage) { const labels: Record<RitualStage, string> = { entry: 'Preview', music: '1 of 6', mood: '2 of 6', journal: '3 of 6', habits: '4 of 6', context: 'Optional', tomorrow: '5 of 6', summary: 'Complete' }; return labels[stage]; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface }, topbar: { minHeight: 60, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topbarButton: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerLow }, topbarTitle: { alignItems: 'center', gap: 2 }, step: { color: palette.onSurfaceVariant },
  scroll: { padding: spacing.md, paddingBottom: spacing['2xl'] }, stage: { gap: spacing.md }, title: { color: palette.onSurface }, copy: { color: palette.onSurfaceVariant }, error: { color: palette.error }, pressed: { opacity: 0.74 }, disabled: { opacity: 0.48 },
  ritualHeroIcon: { width: 52, height: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary }, optionalIntro: { color: palette.onSurfaceVariant, marginTop: spacing.sm },
  stepLine: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, stepIcon: { width: 38, height: 38, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest }, stepBody: { flex: 1, gap: 2 },
  primaryButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radii.md, paddingHorizontal: spacing.md, backgroundColor: palette.primary }, primaryText: { color: palette.onPrimary }, tertiaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md }, tertiaryText: { color: palette.onSurfaceVariant }, loading: { minHeight: 400, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  moodTitle: { color: palette.primary, marginTop: spacing.xs, marginBottom: spacing.xs }, evidenceList: { gap: spacing.sm, marginTop: spacing.md }, evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, evidenceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.primary },
  signalList: { gap: spacing.sm }, signalCard: { minHeight: 92, borderRadius: radii.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surfaceContainer }, signalIcon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary }, signalBody: { flex: 1, gap: 2 }, signalAction: { color: palette.primary, maxWidth: 64, textAlign: 'right' },
  tomorrowRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, tomorrowCopy: { flex: 1, gap: 2 }, pausePill: { minWidth: 60, minHeight: 32, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest }, pausePillActive: { backgroundColor: palette.secondaryContainer },
});
