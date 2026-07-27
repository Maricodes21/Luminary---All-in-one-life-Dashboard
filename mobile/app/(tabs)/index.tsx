import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SpotifyDailyRecap } from '@/components/spotify/SpotifyDailyRecap';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore } from '@/stores/useProductionStore';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';
import { useRitualStore } from '@/stores/useRitualStore';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useWallet } from '@/hooks/useWallet';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { fetchRecap, type SpotifyRecap } from '@/lib/spotify';
import { localDateKey } from '@/lib/meals/dates';
import { getHabitIconName } from '@/lib/habitIcons';
import type { MoodLabel } from '@/lib/mood';
import {
  formatHomeDate,
  expectedMealForTime,
  isRitualCompletedForDate,
  selectDailyRitualSignals,
  type RitualSignal,
} from '@/lib/dailyRitual';

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';

function useHomeSpotifyRecap() {
  return useQuery<SpotifyRecap | null>({
    queryKey: ['spotify-recap', 'home'],
    queryFn: () => fetchRecap(SPOTIFY_CLIENT_ID),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const todayDate = useMemo(() => new Date(), []);
  const today = localDateKey(todayDate);
  const authDisplayName = useAuthStore((state) => state.displayName);
  const profileDisplayName = useProductionStore((state) => state.profileSettings.displayName);
  const habits = useProductionStore((state) =>
    state.habits.filter((habit) => !habit.archivedAt).sort((left, right) => left.position - right.position),
  );
  const workoutPlans = useProductionStore((state) => state.workoutPlans);
  const workoutLogs = useProductionStore((state) => state.workoutLogs);
  const localExpenses = useProductionStore((state) => state.expenses);
  const localJournalEntries = useProductionStore((state) => state.journalEntries);
  const toggleHabitCompletion = useProductionStore((state) => state.toggleHabitCompletion);
  const mealsUser = useMealsStore(activeMealsUser);
  const { transactions } = useWallet();
  const { workouts, latestMetric } = useHealthMetrics();
  const { data: remoteJournalEntries = [] } = useJournalEntries();
  const ritualSession = useRitualStore((state) => state.session);
  const ritualHydrated = useRitualStore((state) => state.hasHydrated);
  const ensureRitualSession = useRitualStore((state) => state.ensureSession);
  const beginRitualSession = useRitualStore((state) => state.beginSession);
  const { data: recap, error: recapError, refetch: refetchRecap, isFetching: recapFetching } = useHomeSpotifyRecap();
  const spotify = useSpotifyAuth();

  const todayMeals = useMemo(
    () => mealsUser?.meals.filter((meal) => meal.localDate === today) ?? [],
    [mealsUser?.meals, today],
  );
  const localWorkoutDone = workoutLogs.some((workout) => workout.workoutDate === today);
  const remoteWorkoutDone = workouts.some((workout) => workout.workout_date === today);
  const workoutCompleted = localWorkoutDone || remoteWorkoutDone;
  const latestPlan = workoutPlans[0];
  const purchaseCount =
    localExpenses.filter((expense) => expense.transactionDate === today).length +
    transactions.filter((transaction) => transaction.transaction_date === today).length;
  const journalCount =
    localJournalEntries.filter((entry) => !entry.deletedAt && localDateKey(new Date(entry.writtenAt)) === today).length +
    remoteJournalEntries.filter((entry) => localDateKey(new Date(entry.written_at)) === today).length;
  const homeHabits = habits.slice(0, 3);
  const completedHome = homeHabits.filter((habit) => habit.completedOn.includes(today)).length;
  const ritualComplete = ritualHydrated && isRitualCompletedForDate(ritualSession, today);
  const ritualInProgress = ritualSession.localDate === today && ritualSession.status === 'in_progress';
  const expectedMeal = expectedMealForTime(todayDate);
  const plannedMeal = mealsUser?.plans
    .flatMap((plan) => plan.entries)
    .find((entry) => entry.localDate === today && entry.mealType === expectedMeal && !todayMeals.some((meal) => meal.mealType === expectedMeal));

  const ritualSignals = useMemo(
    () =>
      selectDailyRitualSignals({
        now: todayDate,
        loggedMealTypes: todayMeals.map((meal) => meal.mealType),
        purchaseCount,
        workoutPlanned: Boolean(latestPlan),
        workoutCompleted,
        workoutLabel: latestPlan ? `${sentenceCase(latestPlan.category)} · ${latestPlan.level}` : undefined,
      }),
    [latestPlan, purchaseCount, todayMeals, todayDate, workoutCompleted],
  );

  useEffect(() => {
    if (ritualHydrated) ensureRitualSession(today);
  }, [ensureRitualSession, ritualHydrated, today]);

  useEffect(() => {
    if (spotify.isConnected) void refetchRecap();
  }, [refetchRecap, spotify.isConnected]);

  function openRitual() {
    beginRitualSession(today, ritualSignals.map((signal) => signal.id));
    router.push('/ritual');
  }

  const plannedMealSignal: RitualSignal | null = plannedMeal
    ? {
        id: `planned-${expectedMeal}`,
        kind: 'meals',
        title: `${sentenceCase(expectedMeal)} is planned`,
        detail: `${plannedMeal.name} is ready in today's meal plan.`,
        action: 'See recipe',
        route: '/(tabs)/meals',
        priority: 100,
      }
    : null;
  const focusSignal = plannedMealSignal ?? ritualSignals.find((signal) => signal.kind === 'health') ?? null;
  const useSplitCockpit = width >= 360 && Boolean(focusSignal);
  const displayName = authDisplayName ?? profileDisplayName ?? 'Mari';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: spacing['3xl'] + spacing['3xl'] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.greetingBlock}>
          <Text style={[type.labelSm, styles.date]}>{formatHomeDate(todayDate)}</Text>
          <Text style={[type.bodyMd, styles.greeting]}>Good day, {displayName}.</Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open profile and settings"
        >
          <Icon name="profile" size={22} color={palette.onSurface} />
          <View style={styles.profileDot}>
            <Icon name="settings" size={11} color={palette.onPrimary} />
          </View>
        </Pressable>
      </View>

      <View style={styles.homeIntro}>
        <Text style={[type.displaySm, styles.homeTitle]}>Your day, connected.</Text>
        <Text style={[type.bodySm, styles.homeCopy]}>Commitments, useful signals and tonight belong to one continuous loop.</Text>
      </View>

      {ritualComplete ? (
        <SpotifyHomeCard
          recap={recap}
          confirmedMood={ritualSession.mood}
          moodSkipped={ritualSession.moodSkipped}
          connected={spotify.isConnected}
          loading={recapFetching}
          error={spotify.error ?? recapError?.message ?? null}
          onConnect={spotify.connect}
          onRefresh={() => refetchRecap()}
          onOpenSummary={() => router.push('/ritual/summary')}
        />
      ) : (
        <TonightCard
          inProgress={ritualInProgress}
          optionalCount={ritualSignals.length}
          onPress={openRitual}
        />
      )}

      <View style={[styles.cockpitRow, useSplitCockpit && styles.cockpitRowSplit]}>
        <View style={styles.commitmentsColumn}>
          <CommitmentsCard
            habits={homeHabits}
            completedCount={completedHome}
            date={today}
            onToggle={toggleHabitCompletion}
            onOpen={() => router.push('/habits')}
            onOpenHabit={(id) => router.push({ pathname: '/habits/[id]', params: { id } })}
          />
        </View>
        {focusSignal ? (
          <View style={useSplitCockpit ? styles.focusColumn : undefined}>
            <FocusCard signal={focusSignal} onPress={() => router.push(focusSignal.route)} />
          </View>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[type.headlineSm, styles.sectionTitle]}>Today at a glance</Text>
        <Text style={[type.labelSm, styles.sectionMeta]}>Useful now</Text>
      </View>

      <View style={styles.signalGrid}>
        <ModuleCard
          icon="meals"
          title="Meals"
          signal={mealSignalCopy(todayDate, todayMeals.map((meal) => meal.mealType))}
          meta={todayMeals.length ? `${todayMeals.length} logged today` : 'Log a meal'}
          accent={palette.tertiary}
          onPress={() => router.push('/(tabs)/meals')}
        />
        <ModuleCard
          icon="health"
          title="Health"
          signal={workoutCompleted ? 'Movement captured for today.' : latestPlan ? 'Workout planned for today.' : 'Build your next movement plan.'}
          meta={latestMetric?.steps ? `${latestMetric.steps.toLocaleString()} steps` : latestPlan ? `${sentenceCase(latestPlan.category)} · ${latestPlan.level}` : 'Open Health'}
          accent={palette.primary}
          onPress={() => router.push('/(tabs)/health')}
        />
        <ModuleCard
          icon="money"
          title="Money"
          signal={purchaseCount ? 'Today’s purchases are captured.' : 'Anything you forgot to log?'}
          meta={purchaseCount ? `${purchaseCount} purchase${purchaseCount === 1 ? '' : 's'} logged` : 'Add a purchase'}
          accent={palette.secondary}
          onPress={() => router.push('/(tabs)/money')}
        />
        <ModuleCard
          icon="journal"
          title="Journal"
          signal={journalCount ? 'Your day already has a page.' : 'Keep one thought from today.'}
          meta={journalCount ? `${journalCount} entr${journalCount === 1 ? 'y' : 'ies'} today` : 'Open Journal'}
          accent={palette.primaryFixed}
          onPress={() => router.push('/(tabs)/journal')}
        />
      </View>
    </ScrollView>
  );
}

function TonightCard({ inProgress, optionalCount, onPress }: {
  inProgress: boolean;
  optionalCount: number;
  onPress: () => void;
}) {
  return (
    <Card variant="featured" style={styles.heroCard}>
      <View style={styles.heroCopyBlock}>
        <SectionLabel>Tonight · about 75 seconds</SectionLabel>
        <Text style={[type.headlineMd, styles.heroTitle]}>{inProgress ? 'Your evening is waiting.' : 'Close the day while it is fresh.'}</Text>
        <Text style={[type.labelSm, styles.heroCopy]} numberOfLines={2}>
          Music and mood · commitments · tomorrow{optionalCount ? ` · ${optionalCount} optional` : ''}
        </Text>
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={inProgress ? 'Resume tonight’s ritual' : 'Begin tonight’s ritual'}
      >
        <Text style={[type.labelMd, styles.primaryButtonText]}>{inProgress ? 'Resume' : 'See tonight'}</Text>
      </Pressable>
    </Card>
  );
}

type CommitmentHabit = { id: string; name: string; completedOn: string[] };

function CommitmentsCard({ habits, completedCount, date, onToggle, onOpen, onOpenHabit }: {
  habits: CommitmentHabit[];
  completedCount: number;
  date: string;
  onToggle: (id: string, date: string) => void;
  onOpen: () => void;
  onOpenHabit: (id: string) => void;
}) {
  return (
    <Card style={styles.commitmentsCard}>
      <Pressable onPress={onOpen} style={styles.cardHeading} accessibilityRole="button" accessibilityLabel="Open commitments hub">
        <Text style={[type.titleLg, styles.cardTitle]}>Commitments</Text>
        <Text style={[type.labelSm, styles.progressText]}>{completedCount}/{habits.length} · Open hub</Text>
      </Pressable>
      <View style={styles.habitList}>
        {habits.map((habit) => {
          const done = habit.completedOn.includes(date);
          return (
            <View key={habit.id} style={styles.habitRow}>
              <Pressable
                onPress={() => onToggle(habit.id, date)}
                style={({ pressed }) => [styles.habitControl, pressed && styles.pressed]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={`Mark ${habit.name} ${done ? 'open' : 'complete'}`}
              >
                <View style={[styles.habitToggle, done && styles.habitToggleDone]}>
                  <Icon name={done ? 'check' : getHabitIconName(habit.name)} size={spacing.md} color={done ? palette.onPrimary : palette.primary} />
                </View>
              </Pressable>
              <Pressable onPress={() => onOpenHabit(habit.id)} style={styles.habitDetail} accessibilityRole="button" accessibilityLabel={`Open ${habit.name}`}>
                <Text style={[type.titleMd, styles.habitName, done && styles.habitNameDone]} numberOfLines={2}>{habit.name}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function FocusCard({ signal, onPress }: { signal: RitualSignal; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.focusCard, pressed && styles.pressed]} accessibilityRole="button">
      <SectionLabel>Next up · {signal.kind}</SectionLabel>
      <Text style={[type.headlineSm, styles.focusTitle]}>{signal.title}</Text>
      <Text style={[type.bodySm, styles.focusCopy]}>{signal.detail}</Text>
      <Text style={[type.labelSm, styles.focusAction]}>{signal.action} →</Text>
    </Pressable>
  );
}

function ModuleCard({ icon, title, signal, meta, accent, onPress }: {
  icon: IconName;
  title: string;
  signal: string;
  meta: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
    >
      <View style={[styles.moduleAccent, { backgroundColor: accent }]} />
      <View style={styles.moduleHeading}>
        <View style={styles.moduleIcon}><Icon name={icon} size={spacing.md} color={accent} /></View>
        <Text style={[type.labelSm, styles.moduleLabel]}>{title}</Text>
        <Text style={[type.titleMd, styles.moduleArrow]}>→</Text>
      </View>
      <Text style={[type.titleMd, styles.moduleSignal]}>{signal}</Text>
      <Text style={[type.bodySm, styles.moduleMeta]} numberOfLines={2}>{meta}</Text>
    </Pressable>
  );
}

function SpotifyHomeCard({
  recap,
  confirmedMood,
  moodSkipped,
  connected,
  loading,
  error,
  onConnect,
  onRefresh,
  onOpenSummary,
}: {
  recap: SpotifyRecap | null | undefined;
  confirmedMood: MoodLabel | null;
  moodSkipped: boolean;
  connected: boolean;
  loading: boolean;
  error: string | null;
  onConnect: () => void;
  onRefresh: () => void;
  onOpenSummary: () => void;
}) {
  if (recap) {
    return (
      <View style={styles.musicCard}>
        <SpotifyDailyRecap
          recap={recap}
          compact
          confirmedMood={confirmedMood}
          moodSkipped={moodSkipped}
          onOpenSummary={onOpenSummary}
        />
      </View>
    );
  }
  return (
    <Card variant="recessed" style={styles.musicCard}>
      <View style={styles.musicEmptyState}>
        <Icon name="sparkles" size={spacing.lg} color={palette.primary} />
        <SectionLabel>Tonight’s soundtrack</SectionLabel>
        <Text style={[type.titleLg, styles.musicEmptyTitle]}>{connected ? 'Your listening recap is catching up' : 'Bring your listening into Luminary'}</Text>
        <Text style={[type.bodySm, styles.musicEmptyCopy]}>
          {error ?? (connected ? (loading ? 'Checking today’s listening.' : 'No listening history has arrived for today yet.') : 'Connect Spotify to see four top tracks and four top artists.')}
        </Text>
        <Pressable onPress={connected ? onRefresh : onConnect} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={[type.labelMd, styles.secondaryButtonText]}>{connected ? 'Refresh listening' : 'Connect Spotify'}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function mealSignalCopy(now: Date, mealTypes: string[]) {
  const hour = now.getHours();
  const expected = hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : 'dinner';
  return mealTypes.some((meal) => meal.toLowerCase() === expected)
    ? `${sentenceCase(expected)} is logged.`
    : `${sentenceCase(expected)} is still open.`;
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingBlock: { gap: spacing.xs },
  date: { color: palette.onSurfaceVariant },
  greeting: { color: palette.onSurface },
  profileButton: { width: spacing['2xl'], height: spacing['2xl'], borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  profileDot: { position: 'absolute', right: spacing.xs, bottom: spacing.xs, width: spacing.lg, height: spacing.lg, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary },
  homeIntro: { gap: spacing.xs },
  homeTitle: { color: palette.onSurface },
  homeCopy: { color: palette.onSurfaceVariant, maxWidth: 520 },
  heroCard: { minHeight: 120, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceBright },
  heroCopyBlock: { flex: 1, gap: spacing.sm },
  heroTitle: { color: palette.onSurface },
  heroCopy: { color: palette.onSurfaceVariant },
  primaryButton: { minWidth: 88, minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, paddingHorizontal: spacing.md, backgroundColor: palette.primary },
  primaryButtonText: { color: palette.onPrimary },
  cockpitRow: { gap: spacing.sm },
  cockpitRowSplit: { flexDirection: 'row', alignItems: 'stretch' },
  commitmentsColumn: { flex: 5 },
  focusColumn: { flex: 3 },
  commitmentsCard: { minHeight: 216, padding: spacing.sm },
  cardHeading: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, paddingHorizontal: spacing.xs },
  cardTitle: { color: palette.onSurface },
  progressText: { color: palette.primary, textAlign: 'right' },
  habitList: { gap: spacing.xs },
  habitRow: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  habitControl: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  habitToggle: { width: 40, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest },
  habitToggleDone: { backgroundColor: palette.primary },
  habitDetail: { flex: 1, minHeight: spacing['2xl'], justifyContent: 'center' },
  habitName: { color: palette.onSurface, flex: 1 },
  habitNameDone: { color: palette.onSurfaceVariant },
  focusCard: { flex: 1, minHeight: 216, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm, backgroundColor: palette.surfaceContainerHigh },
  focusTitle: { color: palette.onSurface, marginTop: spacing.lg },
  focusCopy: { color: palette.onSurfaceVariant, flex: 1 },
  focusAction: { color: palette.primary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  sectionTitle: { color: palette.onSurface },
  sectionMeta: { color: palette.primary },
  signalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moduleCard: { width: '48%', flexGrow: 1, minHeight: 160, borderRadius: radii.md, padding: spacing.md, backgroundColor: palette.surfaceContainerLow, gap: spacing.sm, overflow: 'hidden' },
  moduleAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: spacing.xs },
  moduleHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  moduleIcon: { width: spacing.xl, height: spacing.xl, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest },
  moduleLabel: { color: palette.onSurfaceVariant, flex: 1 },
  moduleArrow: { color: palette.onSurfaceVariant },
  moduleSignal: { color: palette.onSurface, flex: 1 },
  moduleMeta: { color: palette.onSurfaceVariant },
  musicCard: { marginBottom: spacing.xs },
  musicEmptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  musicEmptyTitle: { color: palette.onSurface, textAlign: 'center' },
  musicEmptyCopy: { color: palette.onSurfaceVariant, textAlign: 'center', maxWidth: 320 },
  secondaryButton: { minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.primary, paddingHorizontal: spacing.lg },
  secondaryButtonText: { color: palette.onPrimary },
  pressed: { opacity: 0.72 },
});
