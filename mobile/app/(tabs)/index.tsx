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
import {
  formatHomeDate,
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
  const completedToday = habits.filter((habit) => habit.completedOn.includes(today)).length;
  const ritualComplete = ritualHydrated && isRitualCompletedForDate(ritualSession, today);
  const ritualInProgress = ritualSession.localDate === today && ritualSession.status === 'in_progress';

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

  const focusSignal = ritualSignals.find((signal) => signal.kind === 'health') ?? ritualSignals[0] ?? null;
  const useSplitCockpit = width >= 390 && Boolean(focusSignal);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.greetingBlock}>
          <Text style={[type.labelSm, styles.date]}>{formatHomeDate(todayDate)}</Text>
          <Text style={[type.bodyMd, styles.greeting]}>Good day,</Text>
          <Text style={[type.headlineLg, styles.name]}>{authDisplayName ?? profileDisplayName ?? 'Mari'}</Text>
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

      {ritualComplete ? (
        <SpotifyHomeCard
          recap={recap}
          connected={spotify.isConnected}
          loading={recapFetching}
          error={spotify.error ?? recapError?.message ?? null}
          onConnect={spotify.connect}
          onRefresh={() => refetchRecap()}
        />
      ) : (
        <TonightCard
          inProgress={ritualInProgress}
          optionalCount={ritualSignals.length}
          completedHabits={completedToday}
          totalHabits={habits.length}
          onPress={openRitual}
        />
      )}

      <View style={[styles.cockpitRow, useSplitCockpit && styles.cockpitRowSplit]}>
        <View style={styles.commitmentsColumn}>
          <CommitmentsCard
            habits={habits.slice(0, 4)}
            completedCount={completedToday}
            date={today}
            onToggle={toggleHabitCompletion}
            onOpen={() => router.push('/habits')}
          />
        </View>
        {focusSignal ? (
          <View style={useSplitCockpit ? styles.focusColumn : undefined}>
            <FocusCard signal={focusSignal} onPress={() => router.push(focusSignal.route)} />
          </View>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <SectionLabel>Signal board</SectionLabel>
          <Text style={[type.headlineMd, styles.sectionTitle]}>What may need you</Text>
        </View>
        <Text style={[type.bodySm, styles.sectionMeta]}>Updates with your day</Text>
      </View>

      <View style={styles.signalGrid}>
        <ModuleCard
          icon="meals"
          title="Meals"
          signal={mealSignalCopy(todayDate, todayMeals.map((meal) => meal.mealType))}
          meta={todayMeals.length ? `${todayMeals.length} logged today` : 'Nothing logged yet'}
          accent={palette.secondary}
          onPress={() => router.push('/(tabs)/meals')}
        />
        <ModuleCard
          icon="health"
          title="Health"
          signal={workoutCompleted ? 'Movement captured for today.' : latestPlan ? 'A workout is waiting for today.' : 'Build your next movement plan.'}
          meta={latestMetric?.steps ? `${latestMetric.steps.toLocaleString()} steps` : latestPlan ? `${sentenceCase(latestPlan.category)} · ${latestPlan.level}` : 'No workout planned'}
          accent={palette.tertiaryDim}
          onPress={() => router.push('/(tabs)/health')}
        />
        <ModuleCard
          icon="money"
          title="Money"
          signal={purchaseCount ? 'Today’s purchases are captured.' : 'Log a purchase from today if you forgot one.'}
          meta={purchaseCount ? `${purchaseCount} purchase${purchaseCount === 1 ? '' : 's'} logged` : 'Nothing logged today'}
          accent={palette.primary}
          onPress={() => router.push('/(tabs)/money')}
        />
        <ModuleCard
          icon="journal"
          title="Journal"
          signal={journalCount ? 'Your day already has a page.' : 'Keep one thought from today.'}
          meta={journalCount ? `${journalCount} entr${journalCount === 1 ? 'y' : 'ies'} today` : 'Journal is open'}
          accent={palette.primaryFixed}
          onPress={() => router.push('/(tabs)/journal')}
        />
      </View>
    </ScrollView>
  );
}

function TonightCard({ inProgress, optionalCount, completedHabits, totalHabits, onPress }: {
  inProgress: boolean;
  optionalCount: number;
  completedHabits: number;
  totalHabits: number;
  onPress: () => void;
}) {
  return (
    <Card variant="featured" style={styles.heroCard}>
      <View style={styles.heroTopline}>
        <View style={styles.ritualMark}><Icon name="sparkles" size={18} color={palette.onPrimary} /></View>
        <View style={styles.heroTime}><Icon name="clock" size={14} color={palette.primary} /><Text style={[type.labelSm, styles.heroTimeText]}>about 75 sec</Text></View>
      </View>
      <SectionLabel>Tonight’s recap</SectionLabel>
      <Text style={[type.displaySm, styles.heroTitle]}>Finish tonight.{`\n`}Keep tomorrow lighter.</Text>
      <Text style={[type.bodyMd, styles.heroCopy]}>
        Your music, mood and {totalHabits ? `${completedHabits} of ${totalHabits} commitments` : 'daily commitments'} are ready to review.
        {optionalCount ? ` ${optionalCount} optional check${optionalCount === 1 ? '' : 's'} can be skipped.` : ''}
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={inProgress ? 'Resume tonight’s ritual' : 'Begin tonight’s ritual'}
      >
        <Text style={[type.labelMd, styles.primaryButtonText]}>{inProgress ? 'Resume tonight' : 'Begin tonight'}</Text>
        <Icon name="sparkles" size={17} color={palette.onPrimary} />
      </Pressable>
    </Card>
  );
}

type CommitmentHabit = { id: string; name: string; completedOn: string[] };

function CommitmentsCard({ habits, completedCount, date, onToggle, onOpen }: {
  habits: CommitmentHabit[];
  completedCount: number;
  date: string;
  onToggle: (id: string, date: string) => void;
  onOpen: () => void;
}) {
  return (
    <Card style={styles.commitmentsCard}>
      <Pressable onPress={onOpen} style={styles.cardHeading} accessibilityRole="button" accessibilityLabel="Open commitments hub">
        <View>
          <SectionLabel>Commitments</SectionLabel>
          <Text style={[type.titleLg, styles.cardTitle]}>Small promises, kept visible.</Text>
        </View>
        <View style={styles.progressPill}><Text style={[type.labelSm, styles.progressText]}>{completedCount}/{habits.length}</Text></View>
      </Pressable>
      <View style={styles.habitList}>
        {habits.map((habit) => {
          const done = habit.completedOn.includes(date);
          return (
            <Pressable
              key={habit.id}
              onPress={() => onToggle(habit.id, date)}
              style={({ pressed }) => [styles.habitRow, pressed && styles.pressed]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={habit.name}
            >
              <View style={[styles.habitToggle, done && styles.habitToggleDone]}>
                <Icon name={done ? 'check' : getHabitIconName(habit.name)} size={15} color={done ? palette.onPrimary : palette.onSurfaceVariant} />
              </View>
              <Text style={[type.bodyMd, styles.habitName, done && styles.habitNameDone]}>{habit.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={onOpen} style={styles.textButton} accessibilityRole="button">
        <Text style={[type.labelMd, styles.textButtonText]}>Open commitments</Text>
        <Icon name="calendar" size={16} color={palette.primary} />
      </Pressable>
    </Card>
  );
}

function FocusCard({ signal, onPress }: { signal: RitualSignal; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.focusCard, pressed && styles.pressed]} accessibilityRole="button">
      <View style={styles.focusIcon}><Icon name={moduleIcon(signal.kind)} size={21} color={palette.onPrimary} /></View>
      <SectionLabel>Now in focus</SectionLabel>
      <Text style={[type.headlineSm, styles.focusTitle]}>{signal.title}</Text>
      <Text style={[type.bodySm, styles.focusCopy]}>{signal.detail}</Text>
      <Text style={[type.labelMd, styles.focusAction]}>{signal.action}</Text>
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
      <View style={[styles.moduleIcon, { backgroundColor: accent }]}><Icon name={icon} size={20} color={palette.onPrimary} /></View>
      <Text style={[type.labelSm, styles.moduleLabel]}>{title}</Text>
      <Text style={[type.titleMd, styles.moduleSignal]}>{signal}</Text>
      <Text style={[type.bodySm, styles.moduleMeta]}>{meta}</Text>
    </Pressable>
  );
}

function SpotifyHomeCard({ recap, connected, loading, error, onConnect, onRefresh }: {
  recap: SpotifyRecap | null | undefined;
  connected: boolean;
  loading: boolean;
  error: string | null;
  onConnect: () => void;
  onRefresh: () => void;
}) {
  if (recap) return <View style={styles.musicCard}><SpotifyDailyRecap recap={recap} compact /></View>;
  return (
    <Card variant="recessed" style={styles.musicCard}>
      <View style={styles.musicEmptyState}>
        <Icon name="sparkles" size={24} color={palette.primary} />
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
    : `Start ${expected} when you’re ready.`;
}

function moduleIcon(kind: RitualSignal['kind']): IconName {
  if (kind === 'meals') return 'meals';
  if (kind === 'money') return 'money';
  return 'health';
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  greetingBlock: { gap: 1 },
  date: { color: palette.onSurfaceVariant, marginBottom: spacing.xs },
  greeting: { color: palette.onSurfaceVariant },
  name: { color: palette.onSurface, marginTop: -2 },
  profileButton: { width: 52, height: 52, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  profileDot: { position: 'absolute', right: 4, bottom: 4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary },
  heroCard: { gap: spacing.sm, overflow: 'hidden' },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ritualMark: { width: 38, height: 38, borderRadius: radii.sm, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  heroTime: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.pill, backgroundColor: palette.surfaceContainerHighest },
  heroTimeText: { color: palette.primary },
  heroTitle: { color: palette.onSurface, marginTop: spacing.xs },
  heroCopy: { color: palette.onSurfaceVariant, maxWidth: 520 },
  primaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radii.md, paddingHorizontal: spacing.md, marginTop: spacing.sm, backgroundColor: palette.primary },
  primaryButtonText: { color: palette.onPrimary },
  cockpitRow: { gap: spacing.md },
  cockpitRowSplit: { flexDirection: 'row', alignItems: 'stretch' },
  commitmentsColumn: { flex: 1.4 },
  focusColumn: { flex: 0.8 },
  commitmentsCard: { minHeight: 250 },
  cardHeading: { minHeight: 48, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { color: palette.onSurface, marginTop: spacing.xs },
  progressPill: { minWidth: 44, height: 30, paddingHorizontal: spacing.sm, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest },
  progressText: { color: palette.primary },
  habitList: { marginTop: spacing.sm },
  habitRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  habitToggle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest },
  habitToggleDone: { backgroundColor: palette.tertiaryDim },
  habitName: { color: palette.onSurface, flex: 1 },
  habitNameDone: { color: palette.onSurfaceVariant, textDecorationLine: 'line-through' },
  textButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  textButtonText: { color: palette.primary },
  focusCard: { flex: 1, minHeight: 250, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm, backgroundColor: palette.primaryContainer },
  focusIcon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary },
  focusTitle: { color: palette.onSurface, marginTop: spacing.sm },
  focusCopy: { color: palette.onSurfaceVariant, flex: 1 },
  focusAction: { color: palette.primary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.sm },
  sectionTitle: { color: palette.onSurface, marginTop: spacing.xs },
  sectionMeta: { color: palette.onSurfaceVariant, maxWidth: 120, textAlign: 'right' },
  signalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moduleCard: { width: '48%', flexGrow: 1, minHeight: 192, borderRadius: radii.lg, padding: spacing.md, backgroundColor: palette.surfaceContainer, gap: spacing.sm },
  moduleIcon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { color: palette.onSurfaceVariant },
  moduleSignal: { color: palette.onSurface, flex: 1 },
  moduleMeta: { color: palette.onSurfaceVariant },
  musicCard: { marginBottom: spacing.xs },
  musicEmptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  musicEmptyTitle: { color: palette.onSurface, textAlign: 'center' },
  musicEmptyCopy: { color: palette.onSurfaceVariant, textAlign: 'center', maxWidth: 320 },
  secondaryButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.primary, paddingHorizontal: spacing.lg },
  secondaryButtonText: { color: palette.onPrimary },
  pressed: { opacity: 0.72 },
});
