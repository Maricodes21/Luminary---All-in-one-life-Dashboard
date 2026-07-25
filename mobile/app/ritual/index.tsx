import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
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

  function finishTomorrow() {
    const tomorrowCue = habits.find((habit) => !habit.completedOn.includes(today))?.name ?? 'Begin with one small promise';
    completeSession({
      habitsCompleted: habitsCompleted.length,
      totalHabits,
      movementMinutes: localWorkout?.durationMinutes ?? remoteWorkout?.duration_minutes ?? 0,
      musicMinutes: recap?.minutesListened ?? 0,
      tomorrowCue,
    });
    void writeDailyRitualSession(useRitualStore.getState().session);
  }

  function goBack() {
    const previous: Partial<Record<RitualStage, RitualStage>> = {
      music: 'entry',
      mood: 'music',
      journal: session.mood ? 'music' : 'mood',
      habits: session.moodSkipped ? 'music' : 'journal',
      context: 'habits',
      tomorrow: 'context',
    };
    const target = previous[stage];
    if (target) setStage(target);
    else router.back();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {stage === 'entry' ? <EntryStep signals={selectedSignals} onBack={goBack} onBegin={() => beginSession(today, selectedSignals.map((signal) => signal.id))} /> : null}
        {stage === 'music' ? (
          <MusicStep
            recap={recap}
            loading={isLoading}
            error={error}
            retry={retry}
            onBack={goBack}
            onChooseMood={() => setStage('mood')}
            onSkip={() => { markMoodSkipped(); setStage('habits'); }}
          />
        ) : null}
        {stage === 'mood' ? <ManualMoodStep onBack={goBack} onSkip={() => { markMoodSkipped(); setStage('habits'); }} /> : null}
        {stage === 'journal' ? (
          <View style={styles.stage}>
            <RitualHeading eyebrow="Optional · journal" title="Want to remember why?" description="Add the mood and a sentence directly to Journal, or keep going." onBack={goBack} />
            <JournalStep />
          </View>
        ) : null}
        {stage === 'habits' ? (
          <View style={styles.stage}>
            <RitualHeading eyebrow="Next · commitments" title="How did your commitments go?" description="Complete what happened, or choose an intentional pause." onBack={goBack} />
            <HabitCheckin />
          </View>
        ) : null}
        {stage === 'context' ? <ContextStep signals={selectedSignals} onBack={goBack} onContinue={() => setStage('tomorrow')} onOpen={(signal) => router.push(signal.route)} /> : null}
        {stage === 'tomorrow' ? <TomorrowStep habits={habits} onBack={goBack} onTogglePause={toggleHabitPause} onFinish={finishTomorrow} /> : null}
      </ScrollView>
    </View>
  );
}

function EntryStep({ signals, onBack, onBegin }: { signals: RitualSignal[]; onBack: () => void; onBegin: () => void }) {
  return (
    <View style={styles.stage}>
      <RitualHeading eyebrow="Tonight · about 75 seconds" title="A quick look back." description="Music first, then commitments and a small plan for tomorrow." onBack={onBack} />
      <Card variant="recessed" style={styles.previewCard}>
        <View style={styles.timeOrbit}>
          <Text style={[type.displaySm, styles.timeValue]}>75</Text>
          <Text style={[type.labelSm, styles.timeLabel]}>seconds, roughly</Text>
        </View>
        <View style={styles.previewList}>
          <PreviewLine number="01" label="Music + mood" />
          <PreviewLine number="02" label="Today’s commitments" />
          <PreviewLine number="03" label="Plan tomorrow" />
        </View>
      </Card>
      {signals.length ? (
        <Card variant="recessed" style={styles.optionalPanel}>
          <View style={styles.optionalHeading}>
            <Text style={[type.labelSm, styles.overline]}>Optional tonight</Text>
            <Text style={[type.labelSm, styles.accentText]}>{signals.length} unfinished</Text>
          </View>
          <View style={styles.signalList}>{signals.map((signal) => <SignalCard key={signal.id} signal={signal} />)}</View>
          <Text style={[type.bodySm, styles.centerNote]}>Skip any card. It never blocks the ritual.</Text>
        </Card>
      ) : null}
      <PrimaryButton label="Begin with your music" onPress={onBegin} />
    </View>
  );
}

function PreviewLine({ number, label }: { number: string; label: string }) {
  return <View style={styles.previewLine}><Text style={[type.labelSm, styles.accentText]}>{number}</Text><Text style={[type.titleMd, styles.title]}>{label}</Text></View>;
}

function MusicStep({ recap, loading, error, retry, onBack, onChooseMood, onSkip }: {
  recap: ReturnType<typeof useSpotifyRecap>['recap'];
  loading: boolean;
  error: string | null;
  retry: () => void;
  onBack: () => void;
  onChooseMood: () => void;
  onSkip: () => void;
}) {
  const setMood = useRitualStore((state) => state.setMood);
  const setMoodEventId = useRitualStore((state) => state.setMoodEventId);
  const setStage = useRitualStore((state) => state.setStage);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={palette.primary} size="large" /><Text style={[type.bodyMd, styles.copy]}>Reading today’s soundtrack…</Text></View>;
  }

  if (!recap) {
    return (
      <View style={styles.stage}>
        <RitualHeading eyebrow="First · your music" title="No soundtrack arrived tonight." description={error ?? 'That is okay. Choose how today felt, or skip mood entirely.'} onBack={onBack} />
        <Card variant="recessed" style={styles.emptyMusicCard}>
          <Icon name="sparkles" size={spacing.xl} color={palette.primary} />
          <Text style={[type.titleLg, styles.title]}>Your ritual still works without Spotify.</Text>
          <Text style={[type.bodySm, styles.copy]}>Music is a prompt, never a requirement.</Text>
        </Card>
        {error ? <SecondaryButton label="Try Spotify again" onPress={retry} /> : null}
        <PrimaryButton label="Choose how I feel" onPress={onChooseMood} />
        <TextButton label="Skip mood tonight" onPress={onSkip} />
      </View>
    );
  }

  const musicRecap = recap;
  const estimate = mapAudioFeaturesToMood(musicRecap.averageFeatures);
  const displayMood = moodCopy[estimate.label].display;
  const evidence = buildMusicEvidence(musicRecap).slice(0, 2).join(' · ');

  async function accept() {
    setSaving(true);
    setSaveError(null);
    try {
      const [eventId] = await Promise.all([
        writeMoodEvent({ label: estimate.label, source: 'spotify', confidence: estimate.confidence, features: musicRecap.averageFeatures }),
        writeSpotifySnapshot({ recap: musicRecap, estimatedMood: estimate.label, estimatedConfidence: estimate.confidence }),
      ]);
      setMood({ label: estimate.label, source: 'spotify', confidence: estimate.confidence });
      setMoodEventId(eventId);
      setStage('journal');
    } catch {
      setSaveError('That did not save yet. Try once more.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.stage}>
      <RitualHeading eyebrow="First · your music" title={`Did today feel ${displayMood.toLowerCase()}?`} description="Use the listening signal, change it, or skip mood entirely." onBack={onBack} />
      <Card variant="featured" style={styles.musicHero}>
        <View style={styles.musicGlow} pointerEvents="none" />
        <AlbumStack tracks={musicRecap.topTracks.slice(0, 3)} />
        <Text style={[type.labelSm, styles.musicStats]}>{musicRecap.minutesListened} minutes · {musicRecap.trackCount} tracks</Text>
        <Text style={[type.displayMd, styles.musicMood]}>{displayMood}</Text>
        <Text style={[type.bodySm, styles.musicPrompt]}>Your listening carried {musicRecap.moodPhrase.toLowerCase()}. Does that sound like your day?</Text>
        <View style={styles.evidenceStrip}>
          <Text style={[type.labelSm, styles.evidenceLabel]}>Why this came up</Text>
          <Text style={[type.labelSm, styles.evidenceCopy]}>{evidence}</Text>
        </View>
      </Card>
      {saveError ? <Text style={[type.bodySm, styles.error]}>{saveError}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Yes, this feels right'} onPress={accept} disabled={saving} />
      <SecondaryButton label="Choose a different mood" onPress={onChooseMood} />
      <TextButton label="Skip mood tonight" onPress={onSkip} />
    </View>
  );
}

type RitualTrack = { id: string; name: string; albumImageUrl?: string };

function AlbumStack({ tracks }: { tracks: RitualTrack[] }) {
  return (
    <View style={styles.albumStage} accessibilityLabel="Most-played album covers">
      {[0, 1, 2].map((index) => {
        const track = tracks[index];
        const position = index === 0 ? styles.albumLeft : index === 1 ? styles.albumRight : styles.albumCenter;
        return track?.albumImageUrl ? (
          <Image key={track.id} source={{ uri: track.albumImageUrl }} style={[styles.albumCover, position]} resizeMode="cover" />
        ) : (
          <View key={`empty-${index}`} style={[styles.albumCover, styles.albumFallback, position]}><Text style={[type.headlineMd, styles.copy]}>{track?.name.charAt(0) ?? '♪'}</Text></View>
        );
      })}
    </View>
  );
}

const MANUAL_MOODS: MoodLabel[] = ['wired', 'focused', 'peaceful', 'drained', 'restless', 'energized'];

function ManualMoodStep({ onBack, onSkip }: { onBack: () => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<MoodLabel>('wired');
  const [saving, setSaving] = useState(false);
  const setMood = useRitualStore((state) => state.setMood);
  const setMoodEventId = useRitualStore((state) => state.setMoodEventId);
  const setStage = useRitualStore((state) => state.setStage);

  async function save() {
    setSaving(true);
    const id = await writeMoodEvent({ label: selected, source: 'manual', confidence: 1 });
    setMood({ label: selected, source: 'manual', confidence: 1 });
    setMoodEventId(id);
    setSaving(false);
    setStage('journal');
  }

  return (
    <View style={styles.stage}>
      <RitualHeading eyebrow="Only if music missed" title="How did today actually feel?" description="Choose the closest word, or skip this part." onBack={onBack} />
      <View style={styles.moodOrbit}>
        <Text style={[type.bodySm, styles.copy]}>Your read comes first</Text>
        <Text style={[type.displayMd, styles.musicMood]}>{moodCopy[selected].display}</Text>
        <Text style={[type.bodySm, styles.copy]}>Choose the closest word. You can still skip.</Text>
      </View>
      <View style={styles.moodGrid}>
        {MANUAL_MOODS.map((label) => (
          <Pressable
            key={label}
            onPress={() => setSelected(label)}
            style={[styles.moodChip, selected === label && styles.moodChipSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === label }}
          >
            <Text style={[type.labelMd, selected === label ? styles.accentText : styles.title]}>{moodCopy[label].display}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.actionRow}>
        <View style={styles.actionColumn}><SecondaryButton label="Skip mood tonight" onPress={onSkip} /></View>
        <View style={styles.actionColumn}><PrimaryButton label={saving ? 'Saving…' : 'Use this mood'} onPress={save} disabled={saving} /></View>
      </View>
    </View>
  );
}

function ContextStep({ signals, onBack, onContinue, onOpen }: { signals: RitualSignal[]; onBack: () => void; onContinue: () => void; onOpen: (signal: RitualSignal) => void }) {
  return (
    <View style={styles.stage}>
      <RitualHeading eyebrow="Optional tonight" title="Anything else before tomorrow?" description="Meals, Money and Health only appear when something is unfinished." onBack={onBack} />
      <Card variant="featured" style={styles.introCard}>
        <Text style={[type.labelSm, styles.accentText]}>Optional tonight</Text>
        <Text style={[type.headlineSm, styles.title]}>{signals.length ? 'A few things are still open.' : 'Your essentials are covered.'}</Text>
        <Text style={[type.bodySm, styles.copy]}>{signals.length ? 'Open one now, or leave every card for tomorrow.' : 'There are no extra check-ins asking for your attention.'}</Text>
      </Card>
      <View style={styles.signalList}>{signals.map((signal) => <SignalCard key={signal.id} signal={signal} onPress={() => onOpen(signal)} />)}</View>
      <View style={styles.actionRow}>
        <View style={styles.actionColumn}><SecondaryButton label="Leave these for tomorrow" onPress={onContinue} /></View>
        <View style={styles.actionColumn}><PrimaryButton label="Continue tonight" onPress={onContinue} /></View>
      </View>
    </View>
  );
}

function TomorrowStep({ habits, onBack, onTogglePause, onFinish }: {
  habits: { id: string; name: string; completedOn: string[]; pausedOn?: string[] }[];
  onBack: () => void;
  onTogglePause: (id: string, date: string) => void;
  onFinish: () => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = localDateKey(tomorrow);
  const cue = habits.find((habit) => !habit.completedOn.includes(localDateKey(new Date())))?.name ?? 'Begin with one small promise';

  return (
    <View style={styles.stage}>
      <RitualHeading eyebrow="Last · tomorrow" title="What should stay with you?" description="Keep, pause or carry forward the commitments that still fit." onBack={onBack} />
      <Card variant="featured" style={styles.cueCard}>
        <Text style={[type.labelSm, styles.accentText]}>Tomorrow’s first useful cue</Text>
        <Text style={[type.headlineMd, styles.title]}>Make {cue.toLowerCase()} easy before the day gets loud.</Text>
      </Card>
      <View style={styles.tomorrowHeader}><Text style={[type.labelSm, styles.copy]}>Tomorrow’s commitments</Text><Text style={[type.labelSm, styles.accentText]}>Keep or pause</Text></View>
      <View style={styles.tomorrowList}>{habits.map((habit) => {
        const paused = habit.pausedOn?.includes(tomorrowKey) ?? false;
        return (
          <Pressable key={habit.id} onPress={() => onTogglePause(habit.id, tomorrowKey)} style={({ pressed }) => [styles.tomorrowRow, pressed && styles.pressed]} accessibilityRole="switch" accessibilityState={{ checked: !paused }}>
            <Text style={[type.titleMd, styles.title, styles.tomorrowName]} numberOfLines={2}>{habit.name}</Text>
            <Text style={[type.labelSm, styles.accentText]}>{paused ? 'Paused' : 'Keep active'}</Text>
          </Pressable>
        );
      })}</View>
      <PrimaryButton label="Finish tonight" onPress={onFinish} />
    </View>
  );
}

function RitualHeading({ eyebrow, title, description, onBack }: { eyebrow: string; title: string; description: string; onBack: () => void }) {
  return (
    <View style={styles.heading}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Go back">
        <Icon name="back" size={spacing.lg} color={palette.onSurface} />
      </Pressable>
      <View style={styles.headingCopy}>
        <Text style={[type.labelSm, styles.overline]}>{eyebrow}</Text>
        <Text style={[type.displaySm, styles.headingTitle]}>{title}</Text>
        <Text style={[type.bodyMd, styles.headingDescription]}>{description}</Text>
      </View>
    </View>
  );
}

function SignalCard({ signal, onPress }: { signal: RitualSignal; onPress?: () => void }) {
  const content = (
    <>
      <View style={styles.signalIcon}><Icon name={signalIcon(signal.kind)} size={spacing.md} color={palette.primary} /></View>
      <View style={styles.signalBody}>
        <Text style={[type.labelSm, styles.copy]}>{signal.kind}</Text>
        <Text style={[type.titleMd, styles.title]}>{signal.title}</Text>
        <Text style={[type.bodySm, styles.copy]}>{signal.detail}</Text>
        <Text style={[type.labelSm, styles.accentText]}>{signal.action} →</Text>
      </View>
    </>
  );
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [styles.signalCard, pressed && styles.pressed]} accessibilityRole="button">{content}</Pressable> : <View style={styles.signalCard}>{content}</View>;
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, (pressed || disabled) && styles.disabled]} accessibilityRole="button"><Text style={[type.labelMd, styles.primaryText]}>{label}</Text></Pressable>;
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={[type.labelMd, styles.secondaryText]}>{label}</Text></Pressable>;
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={[type.labelMd, styles.textButtonText]}>{label}</Text></Pressable>;
}

function signalIcon(kind: RitualSignal['kind']): IconName {
  if (kind === 'meals') return 'meals';
  if (kind === 'money') return 'money';
  return 'health';
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  scroll: { padding: spacing.md },
  stage: { gap: spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  backButton: { width: spacing['2xl'], height: spacing['2xl'], borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerLow },
  headingCopy: { flex: 1, gap: spacing.xs },
  overline: { color: palette.primary },
  headingTitle: { color: palette.onSurface },
  headingDescription: { color: palette.onSurfaceVariant },
  title: { color: palette.onSurface },
  copy: { color: palette.onSurfaceVariant },
  accentText: { color: palette.primary },
  error: { color: palette.error },
  pressed: { opacity: 0.74 },
  disabled: { opacity: 0.48 },
  previewCard: { minHeight: 160, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timeOrbit: { width: 120, height: 120, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainer },
  timeValue: { color: palette.onSurface },
  timeLabel: { color: palette.primary, marginTop: spacing.xs, textAlign: 'center' },
  previewList: { flex: 1, gap: spacing.md },
  previewLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionalPanel: { gap: spacing.sm },
  optionalHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  centerNote: { color: palette.onSurfaceVariant, textAlign: 'center' },
  signalList: { gap: spacing.sm },
  signalCard: { minHeight: 96, borderRadius: radii.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceContainerLow },
  signalIcon: { width: spacing['2xl'], height: spacing['2xl'], borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest },
  signalBody: { flex: 1, gap: spacing.xs },
  loading: { minHeight: 400, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyMusicCard: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  musicHero: { minHeight: 360, padding: spacing.md, backgroundColor: palette.surfaceContainerHigh, overflow: 'hidden' },
  musicGlow: { position: 'absolute', top: -spacing['3xl'], right: -spacing['3xl'], width: 180, height: 180, borderRadius: radii.pill, backgroundColor: palette.secondaryContainer, opacity: 0.08 },
  albumStage: { alignSelf: 'center', width: 240, height: 168, marginBottom: spacing.sm },
  albumCover: { position: 'absolute', width: 116, height: 116, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerHighest },
  albumLeft: { left: spacing.md, top: spacing.md, transform: [{ rotate: '-9deg' }] },
  albumRight: { right: spacing.md, top: spacing.sm, transform: [{ rotate: '9deg' }] },
  albumCenter: { left: 62, top: spacing.xl },
  albumFallback: { alignItems: 'center', justifyContent: 'center' },
  musicStats: { color: palette.onSurfaceVariant, marginTop: spacing.xs },
  musicMood: { color: palette.primary, marginTop: spacing.sm },
  musicPrompt: { color: palette.onSurfaceVariant, marginTop: spacing.sm },
  evidenceStrip: { marginTop: spacing.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: palette.surfaceContainerHighest, borderLeftWidth: spacing.xs, borderLeftColor: palette.primary },
  evidenceLabel: { color: palette.onSurfaceVariant },
  evidenceCopy: { color: palette.onSurface, marginTop: spacing.xs, textTransform: 'none', letterSpacing: 0 },
  moodOrbit: { minHeight: 220, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: palette.surfaceContainerLow },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moodChip: { width: '31%', flexGrow: 1, minHeight: spacing['2xl'], borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerLow },
  moodChipSelected: { backgroundColor: palette.primaryContainer },
  introCard: { gap: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionColumn: { flex: 1 },
  cueCard: { minHeight: 148, justifyContent: 'flex-end', gap: spacing.sm },
  tomorrowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  tomorrowList: { gap: spacing.sm },
  tomorrowRow: { minHeight: spacing['3xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow },
  tomorrowName: { flex: 1 },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, paddingHorizontal: spacing.md, backgroundColor: palette.primary },
  primaryText: { color: palette.onPrimary },
  secondaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, paddingHorizontal: spacing.sm, backgroundColor: palette.surfaceContainerLow },
  secondaryText: { color: palette.onSurface },
  textButton: { minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
  textButtonText: { color: palette.primary },
});
