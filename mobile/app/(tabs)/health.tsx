import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { QuickActionTile } from '@/components/ui/QuickActionTile';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ExerciseVisual } from '@/components/health/ExerciseVisual';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import {
  buildWorkoutPlan,
  type PlannedExercise,
  type PlannedExerciseAlternative,
  type WorkoutFocus,
  type WorkoutSession,
} from '@/lib/workoutPlanning';
import { useProductionStore, type WorkoutPlan } from '@/stores/useProductionStore';
import { useGuidedWorkoutStore } from '@/stores/useGuidedWorkoutStore';

type HealthView = 'today' | 'setup' | 'plan';
type OutsideMode = Extract<WorkoutPlan['category'], 'cardio' | 'cycling'>;

const levels: WorkoutPlan['level'][] = ['beginner', 'steady', 'advanced'];
const durations = [25, 40, 55];
const focuses: { value: WorkoutFocus; label: string }[] = [
  { value: 'strength', label: 'Build strength' },
  { value: 'mobility', label: 'Move better' },
  { value: 'energy', label: 'More energy' },
  { value: 'momentum', label: 'Keep momentum' },
];

export default function HealthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workouts, latestMetric, isLoading } = useHealthMetrics();
  const workoutPlans = useProductionStore((state) => state.workoutPlans);
  const workoutLogs = useProductionStore((state) => state.workoutLogs);
  const createWorkoutPlan = useProductionStore((state) => state.createWorkoutPlan);
  const completeWorkout = useProductionStore((state) => state.completeWorkout);
  const startGuidedWorkout = useGuidedWorkoutStore((state) => state.startWorkout);
  const latestPlan = workoutPlans[0];

  const [view, setView] = useState<HealthView>('today');
  const [category, setCategory] = useState<WorkoutPlan['category']>('calisthenics');
  const [outsideMode, setOutsideMode] = useState<OutsideMode>('cardio');
  const [level, setLevel] = useState<WorkoutPlan['level']>('steady');
  const [durationMinutes, setDurationMinutes] = useState(40);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 4, 6]);
  const [weeklyFocus, setWeeklyFocus] = useState<WorkoutFocus>('strength');
  const [connectOpen, setConnectOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [healthPermissionMessage, setHealthPermissionMessage] = useState<string | null>(null);
  const [replacements, setReplacements] = useState<Record<string, PlannedExerciseAlternative>>({});

  const previewSessions = useMemo(
    () => buildWorkoutPlan({
      category,
      level,
      durationMinutes,
      daysPerWeek: selectedWeekdays.length,
      weeklyFocus,
    }),
    [category, durationMinutes, level, selectedWeekdays.length, weeklyFocus],
  );
  const planSessions = useMemo(() => {
    if (hasCurrentWorkoutSessions(latestPlan?.sessions)) return normalizeWorkoutVisuals(latestPlan.sessions);
    if (!latestPlan) return previewSessions;
    return buildWorkoutPlan({
      category: latestPlan.category,
      level: latestPlan.level,
      durationMinutes: latestPlan.durationMinutes ?? 40,
      daysPerWeek: latestPlan.scheduledWeekdays?.length,
      weeklyFocus: latestPlan.weeklyFocus,
      seed: latestPlan.weekOf,
    });
  }, [latestPlan, previewSessions]);
  const schedule = latestPlan?.scheduledWeekdays?.length
    ? latestPlan.scheduledWeekdays
    : distributeWeekdays(planSessions.length);
  const currentSessionIndex = findCurrentOrNextSession(schedule, new Date().getDay());
  const featuredSession = planSessions[currentSessionIndex] ?? planSessions[0];
  const shownSession = planSessions[selectedSessionIndex] ?? featuredSession;
  const planCategory = latestPlan?.category ?? category;
  const planDuration = latestPlan?.durationMinutes ?? durationMinutes;
  const planLevel = latestPlan?.level ?? level;
  const planFocus = latestPlan?.weeklyFocus ?? weeklyFocus;
  const loggedWorkouts = [
    ...workoutLogs.map((workout) => ({
      id: workout.id,
      title: workout.title,
      workoutType: workout.workoutType,
      workoutDate: workout.workoutDate,
      durationMinutes: workout.durationMinutes,
    })),
    ...workouts.map((workout) => ({
      id: workout.id,
      title: workout.workout_type,
      workoutType: workout.workout_type,
      workoutDate: workout.workout_date,
      durationMinutes: workout.duration_minutes ?? 0,
    })),
  ];

  const openSetup = () => {
    if (latestPlan) {
      setCategory(latestPlan.category);
      if (latestPlan.category === 'cardio' || latestPlan.category === 'cycling') setOutsideMode(latestPlan.category);
      setLevel(latestPlan.level);
      setDurationMinutes(latestPlan.durationMinutes ?? 40);
      setSelectedWeekdays(latestPlan.scheduledWeekdays?.length ? latestPlan.scheduledWeekdays : distributeWeekdays(planSessions.length));
      setWeeklyFocus(latestPlan.weeklyFocus ?? 'momentum');
    }
    setView('setup');
  };

  const buildPlan = () => {
    createWorkoutPlan({ category, level, durationMinutes, scheduledWeekdays: selectedWeekdays, weeklyFocus });
    setReplacements({});
    setSelectedSessionIndex(0);
    setView('plan');
  };

  const openWorkout = (index: number) => {
    setSelectedSessionIndex(index);
    setWorkoutOpen(true);
  };

  const toggleWeekday = (weekday: number) => {
    setSelectedWeekdays((current) => {
      if (current.includes(weekday)) {
        return current.length <= 2 ? current : current.filter((item) => item !== weekday);
      }
      return [...current, weekday].sort((left, right) => weekdayOrder(left) - weekdayOrder(right));
    });
  };

  const onRequestHealthPermissions = async () => {
    setHealthPermissionMessage('Opening Android app settings. Native Health Connect permissions are not wired yet.');
    await Linking.openSettings().catch(() => {
      setHealthPermissionMessage('Could not open settings from the emulator. Check Android app permissions manually.');
    });
  };

  const onReplaceExercise = (session: WorkoutSession, exercise: PlannedExercise) => {
    const key = `${session.id}:${exercise.id}`;
    const original = withoutAlternatives(exercise);
    const options = [original, ...exercise.alternatives];
    const current = replacements[key] ?? original;
    const currentIndex = options.findIndex((option) => option.id === current.id);
    const next = options[(currentIndex + 1) % options.length];
    setReplacements((currentReplacements) => {
      if (next.id === exercise.id) {
        const updated = { ...currentReplacements };
        delete updated[key];
        return updated;
      }
      return { ...currentReplacements, [key]: next };
    });
  };

  const onCompleteWorkout = (session: WorkoutSession) => {
    completeWorkout({
      title: session.title,
      workoutType: planCategory,
      durationMinutes: session.durationMinutes,
      notes: session.exercises.map((exercise) => replacements[`${session.id}:${exercise.id}`]?.name ?? exercise.name).join(', '),
    });
    setWorkoutOpen(false);
    setView('today');
  };

  const onStartWorkout = (session: WorkoutSession) => {
    const resolvedSession: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((exercise) => {
        const replacement = replacements[`${session.id}:${exercise.id}`];
        return replacement ? { ...replacement, alternatives: exercise.alternatives } : exercise;
      }),
    };
    startGuidedWorkout({ planId: latestPlan?.id, session: resolvedSession, category: planCategory });
    setWorkoutOpen(false);
    router.push('/health/workout');
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {view === 'today' ? (
          <TodayBrief
            latestPlan={latestPlan}
            sessions={planSessions}
            schedule={schedule}
            currentSessionIndex={currentSessionIndex}
            featuredSession={featuredSession}
            category={planCategory}
            level={planLevel}
            durationMinutes={planDuration}
            weeklyFocus={planFocus}
            latestMetric={latestMetric}
            loggedWorkouts={loggedWorkouts}
            isLoading={isLoading}
            onOpenSettings={() => router.push('/settings')}
            onOpenWorkout={openWorkout}
            onOpenPlan={() => setView('plan')}
            onOpenSetup={openSetup}
            onConnect={() => setConnectOpen(true)}
          />
        ) : view === 'setup' ? (
          <PlanSetup
            category={category}
            outsideMode={outsideMode}
            level={level}
            durationMinutes={durationMinutes}
            selectedWeekdays={selectedWeekdays}
            weeklyFocus={weeklyFocus}
            onBack={() => setView('today')}
            onCategoryChange={setCategory}
            onOutsideModeChange={(mode) => { setOutsideMode(mode); setCategory(mode); }}
            onLevelChange={setLevel}
            onDurationChange={setDurationMinutes}
            onToggleWeekday={toggleWeekday}
            onFocusChange={setWeeklyFocus}
            onBuild={buildPlan}
          />
        ) : (
          <GeneratedPlan
            sessions={planSessions}
            schedule={schedule}
            category={planCategory}
            level={planLevel}
            durationMinutes={planDuration}
            weeklyFocus={planFocus}
            onBack={() => setView('today')}
            onAdjust={openSetup}
            onOpenWorkout={openWorkout}
            onKeep={() => setView('today')}
          />
        )}
      </ScrollView>

      <ActionSheet visible={connectOpen} onClose={() => setConnectOpen(false)} eyebrow="Permissioned data" title="Connect Health services">
        <QuickActionTile icon="health" label="Health Connect" detail="Steps, heart rate, sleep, and workouts" accent={palette.tertiary} onPress={onRequestHealthPermissions} />
        <Text style={[type.bodyMd, styles.secondaryText]}>
          Luminary requests only the signals it can explain. Your plan works without Health Connect, and access can be revoked at any time.
        </Text>
        {healthPermissionMessage ? <Text style={[type.bodySm, styles.accentText]}>{healthPermissionMessage}</Text> : null}
        <PrimaryButton label="Request permissions" onPress={onRequestHealthPermissions} />
      </ActionSheet>

      <ActionSheet
        visible={workoutOpen}
        onClose={() => setWorkoutOpen(false)}
        eyebrow={`${shownSession.durationMinutes} minutes / ${categoryLabel(planCategory)}`}
        title={shownSession.title}
      >
        <ExerciseVisual visualId={shownSession.exercises[0]?.visualId ?? 'home_pushup'} style={styles.sheetHeroImage} />
        <Card variant="recessed">
          <SectionLabel>Warm up</SectionLabel>
          <Text style={[type.bodyMd, styles.secondaryText, styles.copyTop]}>{shownSession.warmup}</Text>
        </Card>
        <View style={styles.exerciseList}>
          {shownSession.exercises.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              replacement={replacements[`${shownSession.id}:${exercise.id}`]}
              onReplace={() => onReplaceExercise(shownSession, exercise)}
            />
          ))}
        </View>
        <Card variant="recessed">
          <SectionLabel>How this week grows</SectionLabel>
          <Text style={[type.bodyMd, styles.primaryText, styles.copyTop]}>{shownSession.progression}</Text>
          <Text style={[type.bodySm, styles.secondaryText, styles.copyTop]}>{shownSession.cooldown}</Text>
        </Card>
        <PrimaryButton label="Start workout" onPress={() => onStartWorkout(shownSession)} />
        <SecondaryButton label="Mark complete" onPress={() => onCompleteWorkout(shownSession)} />
      </ActionSheet>
    </>
  );
}

function TodayBrief({
  latestPlan,
  sessions,
  schedule,
  currentSessionIndex,
  featuredSession,
  category,
  level,
  durationMinutes,
  weeklyFocus,
  latestMetric,
  loggedWorkouts,
  isLoading,
  onOpenSettings,
  onOpenWorkout,
  onOpenPlan,
  onOpenSetup,
  onConnect,
}: {
  latestPlan?: WorkoutPlan;
  sessions: WorkoutSession[];
  schedule: number[];
  currentSessionIndex: number;
  featuredSession: WorkoutSession;
  category: WorkoutPlan['category'];
  level: WorkoutPlan['level'];
  durationMinutes: number;
  weeklyFocus: WorkoutFocus;
  latestMetric: ReturnType<typeof useHealthMetrics>['latestMetric'];
  loggedWorkouts: { id: string; title: string; workoutType: string; workoutDate: string; durationMinutes: number }[];
  isLoading: boolean;
  onOpenSettings: () => void;
  onOpenWorkout: (index: number) => void;
  onOpenPlan: () => void;
  onOpenSetup: () => void;
  onConnect: () => void;
}) {
  const planDates = datesForSchedule(schedule);
  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <SectionLabel>{formatLongDate(new Date())}</SectionLabel>
          <Text style={[type.displaySm, styles.primaryText, styles.copyTop]}>Movement</Text>
        </View>
        <Pressable onPress={onOpenSettings} style={styles.profileButton} accessibilityRole="button" accessibilityLabel="Open profile and settings">
          <Icon name="profile" size={spacing.lg} color={palette.onSurface} />
          <View style={styles.profileDot}><Icon name="settings" size={spacing.md} color={palette.onPrimary} /></View>
        </Pressable>
      </View>

      <Pressable onPress={() => latestPlan ? onOpenWorkout(currentSessionIndex) : onOpenSetup()} style={styles.sectionTop} accessibilityRole="button">
        <Card variant="featured" padding="sm">
          <ExerciseVisual visualId={featuredSession.exercises[0]?.visualId ?? 'home_pushup'} style={styles.heroImage} />
          <View style={styles.heroContent}>
            <SectionLabel>{latestPlan ? `Today / ${durationMinutes} min` : 'Your first week'}</SectionLabel>
            <Text style={[type.headlineLg, styles.primaryText, styles.copyTop]}>{latestPlan ? featuredSession.title : 'Build a week around you.'}</Text>
            <Text style={[type.bodyMd, styles.secondaryText, styles.copyTop]}>
              {latestPlan ? dailyGuidance(featuredSession, latestMetric != null) : 'Choose your setting, available days, time, and the kind of support you need.'}
            </Text>
            <View style={styles.heroAction}>
              <Text style={[type.labelMd, styles.heroActionText]}>{latestPlan ? 'Open workout' : 'Plan the week'}</Text>
              <ForwardIcon color={palette.onPrimary} />
            </View>
          </View>
        </Card>
      </Pressable>

      <View style={styles.metricSentence}>
        <Text style={[type.displayMd, styles.primaryText]}>{sessions.length}</Text>
        <Text style={[type.bodySm, styles.secondaryText]}>days planned</Text>
        <View style={styles.metricMarker} />
        <Text style={[type.displayMd, styles.primaryText]}>{sessions.length * durationMinutes}</Text>
        <Text style={[type.bodySm, styles.secondaryText]}>minutes</Text>
      </View>

      <View style={styles.sectionTop}>
        <View style={styles.sectionHeading}>
          <View>
            <SectionLabel>This week</SectionLabel>
            <Text style={[type.headlineMd, styles.primaryText, styles.copyTop]}>Your training brief</Text>
          </View>
          <TextButton label="See plan" onPress={onOpenPlan} />
        </View>
        <View style={styles.briefDays}>
          {sessions.slice(0, 4).map((session, index) => (
            <Pressable key={session.id} onPress={() => onOpenWorkout(index)} accessibilityRole="button">
              <Card variant={index === currentSessionIndex ? 'featured' : 'default'} padding="md">
                <View style={styles.dayRow}>
                  <View style={styles.dayLabelBlock}>
                    <Text style={[type.labelSm, index === currentSessionIndex ? styles.accentText : styles.secondaryText]}>
                      {index === currentSessionIndex ? 'Next' : shortWeekday(planDates[index])}
                    </Text>
                    <Text style={[type.titleLg, styles.primaryText]}>{session.title}</Text>
                    <Text style={[type.bodySm, styles.secondaryText]}>{session.durationMinutes} min / {session.exercises.length} movements</Text>
                  </View>
                  <ForwardIcon color={palette.primary} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      <Card variant="featured" style={styles.sectionTop}>
        <SectionLabel>Your plan, your shape</SectionLabel>
        <Text style={[type.headlineMd, styles.primaryText, styles.copyTop]}>Make the week fit real life.</Text>
        <Text style={[type.bodyMd, styles.secondaryText, styles.copyTop]}>
          {categoryLabel(category)} / {levelLabel(level)} / {sessions.length} days. Change the shape whenever life changes.
        </Text>
        <SecondaryButton label={latestPlan ? 'Plan or adjust the week' : 'Plan the week'} onPress={onOpenSetup} />
      </Card>

      <Card style={styles.sectionTop}>
        <View style={styles.sectionHeading}>
          <View>
            <SectionLabel>Body context</SectionLabel>
            <Text style={[type.titleLg, styles.primaryText, styles.copyTop]}>{latestMetric ? 'Health signals connected' : 'Useful, never required'}</Text>
          </View>
          <TextButton label={latestMetric ? 'Manage' : 'Connect'} onPress={onConnect} />
        </View>
        <Text style={[type.bodySm, styles.secondaryText, styles.copyTop]}>
          {latestMetric
            ? `${formatNumber(latestMetric.steps)} steps / ${formatNumber(latestMetric.heart_rate_bpm)} bpm / ${formatSleep(latestMetric.sleep_minutes)} sleep`
            : 'Add steps, heart rate, and sleep when you want a little more context. Your workout plan works without them.'}
        </Text>
      </Card>

      <View style={styles.sectionTop}>
        <Text style={[type.headlineMd, styles.primaryText]}>Captured workouts</Text>
        {isLoading ? (
          <ActivityIndicator color={palette.primary} style={styles.loading} />
        ) : loggedWorkouts.length ? (
          <View style={styles.historyList}>
            {loggedWorkouts.slice(0, 4).map((workout) => (
              <Card key={workout.id} variant="recessed">
                <View style={styles.dayRow}>
                  <View style={styles.dayLabelBlock}>
                    <Text style={[type.titleMd, styles.primaryText]}>{workout.title}</Text>
                    <Text style={[type.bodySm, styles.secondaryText]}>{workout.workoutDate} / {workout.durationMinutes || '--'} min / {formatLabel(workout.workoutType)}</Text>
                  </View>
                  <Icon name="check" size={spacing.md} color={palette.tertiary} />
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card variant="recessed" style={styles.copyTop}>
            <Text style={[type.bodyMd, styles.secondaryText]}>Completed sessions will collect here without interrupting the daily brief.</Text>
          </Card>
        )}
      </View>
    </>
  );
}

function PlanSetup({
  category,
  outsideMode,
  level,
  durationMinutes,
  selectedWeekdays,
  weeklyFocus,
  onBack,
  onCategoryChange,
  onOutsideModeChange,
  onLevelChange,
  onDurationChange,
  onToggleWeekday,
  onFocusChange,
  onBuild,
}: {
  category: WorkoutPlan['category'];
  outsideMode: OutsideMode;
  level: WorkoutPlan['level'];
  durationMinutes: number;
  selectedWeekdays: number[];
  weeklyFocus: WorkoutFocus;
  onBack: () => void;
  onCategoryChange: (category: WorkoutPlan['category']) => void;
  onOutsideModeChange: (mode: OutsideMode) => void;
  onLevelChange: (level: WorkoutPlan['level']) => void;
  onDurationChange: (duration: number) => void;
  onToggleWeekday: (weekday: number) => void;
  onFocusChange: (focus: WorkoutFocus) => void;
  onBuild: () => void;
}) {
  const weekDates = currentWeekDates();
  const location = category === 'gym' ? 'gym' : category === 'calisthenics' ? 'home' : category === 'yoga' ? 'yoga' : 'outside';
  return (
    <>
      <FlowHeader eyebrow="Plan setup / 1 of 2" title="Plan around real life." onBack={onBack} />
      <Text style={[type.bodyLg, styles.secondaryText, styles.flowIntro]}>
        Start with the shape of your week. You can review and swap every movement before you complete it.
      </Text>

      <SetupField number="01" title="What are you doing?">
        <View style={styles.locationGrid}>
          <LocationChoice label="Home" detail="Bodyweight + bands" icon="home" selected={location === 'home'} onPress={() => onCategoryChange('calisthenics')} />
          <LocationChoice label="Gym" detail="Machines + weights" icon="health" selected={location === 'gym'} onPress={() => onCategoryChange('gym')} />
          <LocationChoice label="Outside" detail="Run or cycle" icon="trend" selected={location === 'outside'} onPress={() => onCategoryChange(outsideMode)} />
          <LocationChoice label="Yoga" detail="Stretch + restore" icon="heart" selected={location === 'yoga'} onPress={() => onCategoryChange('yoga')} />
        </View>
        {location === 'outside' ? (
          <View style={styles.segmentedRow}>
            <Segment label="Run" selected={outsideMode === 'cardio'} onPress={() => onOutsideModeChange('cardio')} />
            <Segment label="Cycle" selected={outsideMode === 'cycling'} onPress={() => onOutsideModeChange('cycling')} />
          </View>
        ) : null}
      </SetupField>

      <SetupField number="02" title="How should it meet you?">
        <View style={styles.segmentedRow}>
          {levels.map((item) => <Segment key={item} label={levelLabel(item)} selected={level === item} onPress={() => onLevelChange(item)} />)}
        </View>
      </SetupField>

      <SetupField number="03" title="Which days have room?" detail={`${selectedWeekdays.length} selected`}>
        <View style={styles.dayPicker}>
          {weekDates.map((date) => {
            const weekday = date.getDay();
            const selected = selectedWeekdays.includes(weekday);
            return (
              <Pressable
                key={date.toISOString()}
                onPress={() => onToggleWeekday(weekday)}
                style={[styles.dayChoice, selected && styles.selectedChoice]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[type.labelSm, selected ? styles.selectedText : styles.secondaryText]}>{narrowWeekday(date)}</Text>
                <Text style={[type.titleMd, selected ? styles.selectedText : styles.primaryText]}>{date.getDate()}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[type.bodySm, styles.secondaryText, styles.fieldNote]}>Choose at least two. Sessions follow these days in order.</Text>
      </SetupField>

      <SetupField number="04" title="How much time?">
        <View style={styles.segmentedRow}>
          {durations.map((item) => <Segment key={item} label={String(item)} selected={durationMinutes === item} onPress={() => onDurationChange(item)} />)}
        </View>
        <Text style={[type.bodySm, styles.secondaryText, styles.fieldNote]}>
          {durationMinutes} minutes gives each day {durationMinutes <= 25 ? 'four' : durationMinutes >= 55 ? 'six' : 'five'} movements with room to settle in.
        </Text>
      </SetupField>

      <SetupField number="05" title="What matters this week?">
        <View style={styles.focusGrid}>
          {focuses.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => onFocusChange(item.value)}
              style={[styles.focusChoice, weeklyFocus === item.value && styles.selectedChoice]}
              accessibilityRole="button"
              accessibilityState={{ selected: weeklyFocus === item.value }}
            >
              <Text style={[type.labelMd, weeklyFocus === item.value ? styles.selectedText : styles.primaryText]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </SetupField>

      <Card variant="featured" style={styles.sectionTop}>
        <View style={styles.setupSummary}>
          <View style={styles.headerCopy}>
            <SectionLabel>Your shape</SectionLabel>
            <Text style={[type.titleLg, styles.primaryText, styles.copyTop]}>{categoryLabel(category)} / {levelLabel(level)} / {selectedWeekdays.length} days</Text>
            <Text style={[type.bodySm, styles.secondaryText, styles.copyTop]}>{durationMinutes} minutes with {focusLabel(weeklyFocus).toLowerCase()} as the lead.</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={[type.displaySm, styles.primaryText]}>{selectedWeekdays.length * durationMinutes}</Text>
            <Text style={[type.labelSm, styles.secondaryText]}>min / week</Text>
          </View>
        </View>
      </Card>
      <PrimaryButton label="Build my week" onPress={onBuild} />
    </>
  );
}

function GeneratedPlan({
  sessions,
  schedule,
  category,
  level,
  durationMinutes,
  weeklyFocus,
  onBack,
  onAdjust,
  onOpenWorkout,
  onKeep,
}: {
  sessions: WorkoutSession[];
  schedule: number[];
  category: WorkoutPlan['category'];
  level: WorkoutPlan['level'];
  durationMinutes: number;
  weeklyFocus: WorkoutFocus;
  onBack: () => void;
  onAdjust: () => void;
  onOpenWorkout: (index: number) => void;
  onKeep: () => void;
}) {
  const dates = datesForSchedule(schedule);
  return (
    <>
      <FlowHeader eyebrow="Your training brief" title="Your week, built." onBack={onBack} />
      <View style={styles.planMeta}>
        {[categoryLabel(category), levelLabel(level), `${sessions.length} days`, `${durationMinutes} min`].map((item) => (
          <View key={item} style={styles.metaPill}><Text style={[type.labelSm, styles.primaryText]}>{item}</Text></View>
        ))}
      </View>

      <Card variant="featured" style={styles.sectionTop}>
        <View style={styles.sectionHeading}>
          <View style={styles.headerCopy}>
            <SectionLabel>The shape</SectionLabel>
            <Text style={[type.headlineMd, styles.primaryText, styles.copyTop]}>{planLeadTitle(weeklyFocus)}</Text>
          </View>
          <TextButton label="Adjust" onPress={onAdjust} />
        </View>
        <Text style={[type.bodyMd, styles.secondaryText, styles.copyTop]}>{planLeadCopy(weeklyFocus, sessions)}</Text>
      </Card>

      <View style={styles.generatedWeek}>
        {sessions.map((session, index) => (
          <Pressable key={session.id} onPress={() => onOpenWorkout(index)} accessibilityRole="button">
            <Card variant={index === 0 ? 'featured' : 'default'} padding="sm">
              <View style={styles.generatedRow}>
                <View style={styles.dateBlock}>
                  <Text style={[type.labelSm, styles.secondaryText]}>{shortWeekday(dates[index])}</Text>
                  <Text style={[type.headlineMd, styles.primaryText]}>{dates[index]?.getDate() ?? index + 1}</Text>
                </View>
                <ExerciseVisual visualId={session.exercises[0]?.visualId ?? 'home_pushup'} style={styles.planThumbnail} />
                <View style={styles.generatedCopy}>
                  <SectionLabel>{index === 0 ? 'Day 1' : `Day ${index + 1}`}</SectionLabel>
                  <Text style={[type.titleLg, styles.primaryText]}>{session.title}</Text>
                  <Text style={[type.bodySm, styles.secondaryText]}>{session.durationMinutes} min / {session.exercises.length} movements</Text>
                </View>
                <ForwardIcon color={palette.primary} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Card variant="recessed" style={styles.sectionTop}>
        <SectionLabel>How the week grows</SectionLabel>
        <Text style={[type.titleLg, styles.primaryText, styles.copyTop]}>Earn the next step.</Text>
        <Text style={[type.bodyMd, styles.secondaryText, styles.copyTop]}>{sessions[0]?.progression}</Text>
      </Card>
      <PrimaryButton label="Keep this plan" onPress={onKeep} />
      <TextButton label="Change the setup" onPress={onAdjust} centered />
    </>
  );
}

function FlowHeader({ eyebrow, title, onBack }: { eyebrow: string; title: string; onBack: () => void }) {
  return (
    <View style={styles.flowHeader}>
      <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back to Movement">
        <Icon name="back" size={spacing.lg} color={palette.onSurface} />
      </Pressable>
      <View style={styles.headerCopy}>
        <SectionLabel>{eyebrow}</SectionLabel>
        <Text style={[type.displaySm, styles.primaryText, styles.copyTop]}>{title}</Text>
      </View>
    </View>
  );
}

function SetupField({ number, title, detail, children }: { number: string; title: string; detail?: string; children: React.ReactNode }) {
  return (
    <View style={styles.setupField}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldTitle}>
          <View style={styles.numberBadge}><Text style={[type.labelSm, styles.accentText]}>{number}</Text></View>
          <Text style={[type.titleLg, styles.primaryText]}>{title}</Text>
        </View>
        {detail ? <Text style={[type.labelSm, styles.secondaryText]}>{detail}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function LocationChoice({ label, detail, icon, selected, onPress }: { label: string; detail: string; icon: 'home' | 'health' | 'trend' | 'heart'; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.locationChoice, selected && styles.selectedChoice]} accessibilityRole="button" accessibilityState={{ selected }}>
      <Icon name={icon} size={spacing.lg} color={selected ? palette.onPrimary : palette.primary} />
      <Text style={[type.titleMd, selected ? styles.selectedText : styles.primaryText]}>{label}</Text>
      <Text style={[type.bodySm, selected ? styles.selectedSubtext : styles.secondaryText]}>{detail}</Text>
    </Pressable>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, selected && styles.selectedChoice]} accessibilityRole="button" accessibilityState={{ selected }}>
      <Text style={[type.labelMd, selected ? styles.selectedText : styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button">
      <Text style={[type.labelMd, styles.heroActionText]}>{label}</Text>
      <ForwardIcon color={palette.onPrimary} />
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton} accessibilityRole="button">
      <Text style={[type.labelMd, styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

function ForwardIcon({ color }: { color: string }) {
  return <Text style={[type.headlineMd, { color }]}>→</Text>;
}

function TextButton({ label, onPress, centered = false }: { label: string; onPress: () => void; centered?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.textButton, centered && styles.centeredButton]} accessibilityRole="button">
      <Text style={[type.labelMd, styles.accentText]}>{label}</Text>
    </Pressable>
  );
}

function ExerciseRow({ exercise, replacement, onReplace }: { exercise: PlannedExercise; replacement?: PlannedExerciseAlternative; onReplace: () => void }) {
  const shown = replacement ?? exercise;
  return (
    <View style={styles.exerciseRow}>
      <ExerciseVisual visualId={shown.visualId} style={styles.exerciseImage} />
      <View style={styles.generatedCopy}>
        <Text style={[type.titleMd, styles.primaryText]}>{shown.name}</Text>
        <Text style={[type.labelSm, styles.accentText, styles.copyTop]}>{shown.prescription}</Text>
        <View style={styles.instructionList}>
          <Instruction number="1" label="Set up" copy={shown.instructions.setup} />
          <Instruction number="2" label="Move" copy={shown.instructions.movement} />
          <Instruction number="3" label="Breathe" copy={shown.instructions.breathing} />
          <Instruction number="4" label="Finish" copy={shown.instructions.completion} />
        </View>
      </View>
      <Pressable onPress={onReplace} style={styles.swapButton} accessibilityRole="button" accessibilityLabel={`Swap ${shown.name}`}>
        <Icon name="swap" size={spacing.md} color={palette.primary} />
        <Text style={[type.labelSm, styles.accentText]}>Swap</Text>
      </Pressable>
    </View>
  );
}

function Instruction({ number, label, copy }: { number: string; label: string; copy: string }) {
  return (
    <View style={styles.instructionRow}>
      <Text style={[type.labelSm, styles.instructionNumber]}>{number}</Text>
      <Text style={[type.bodySm, styles.secondaryText, styles.instructionCopy]}>
        <Text style={[type.labelSm, styles.primaryText]}>{label}: </Text>{copy}
      </Text>
    </View>
  );
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

function formatNumber(value: number | null) {
  return value == null ? '--' : Intl.NumberFormat().format(value);
}

function formatSleep(value: number | null) {
  if (value == null) return '--';
  return `${Math.floor(value / 60)}h ${value % 60}m`;
}

function formatLabel(value: string) {
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function levelLabel(level: WorkoutPlan['level']) {
  if (level === 'beginner') return 'New';
  if (level === 'advanced') return 'Experienced';
  return 'Steady';
}

function categoryLabel(category: WorkoutPlan['category']) {
  if (category === 'calisthenics') return 'Home';
  if (category === 'cardio') return 'Run';
  if (category === 'cycling') return 'Cycle';
  if (category === 'yoga') return 'Yoga';
  return 'Gym';
}

function focusLabel(focus: WorkoutFocus) {
  return focuses.find((item) => item.value === focus)?.label ?? 'Keep momentum';
}

function planLeadTitle(focus: WorkoutFocus) {
  if (focus === 'strength') return 'Strength, then room to recover.';
  if (focus === 'mobility') return 'Control first, strength through range.';
  if (focus === 'energy') return 'Build the engine without emptying it.';
  return 'A repeatable week that can bend.';
}

function planLeadCopy(focus: WorkoutFocus, sessions: WorkoutSession[]) {
  const first = sessions[0]?.title ?? 'Your first session';
  const last = sessions.at(-1)?.title ?? 'a steady close';
  if (focus === 'strength') return `${first} leads the week. The plan balances it before ${last.toLowerCase()}.`;
  if (focus === 'mobility') return `${first} opens the week with control. Each later session keeps useful range in the plan.`;
  if (focus === 'energy') return `${first} starts at a repeatable pace. Harder work is spaced so recovery can keep up.`;
  return `${first} starts the rhythm. The remaining days stay achievable even when the week moves.`;
}

function dailyGuidance(session: WorkoutSession, hasHealthData: boolean) {
  const context = hasHealthData ? 'Your latest body signals look settled' : 'Built from your chosen rhythm';
  return `${session.exercises.length} movements. ${context}; keep two good reps in reserve.`;
}

function withoutAlternatives(exercise: PlannedExercise): PlannedExerciseAlternative {
  const { alternatives: _alternatives, ...details } = exercise;
  return details;
}

function hasCurrentWorkoutSessions(sessions: WorkoutSession[] | undefined): sessions is WorkoutSession[] {
  return Boolean(sessions?.length && sessions.every((session) => session.exercises.every((exercise) =>
    typeof exercise.visualId === 'string'
    && exercise.alternatives.every((alternative) => typeof alternative === 'object' && typeof alternative.visualId === 'string'),
  )));
}

function normalizeWorkoutVisuals(sessions: WorkoutSession[]) {
  return sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      visualId: exercise.id.startsWith('yoga_') ? exercise.id : exercise.visualId,
      alternatives: exercise.alternatives.map((alternative) => ({
        ...alternative,
        visualId: alternative.id.startsWith('yoga_') ? alternative.id : alternative.visualId,
      })),
    })),
  }));
}

function currentWeekDates() {
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function datesForSchedule(schedule: number[]) {
  const week = currentWeekDates();
  const moveToNextWeek = schedule.every((weekday) => weekdayOrder(weekday) < weekdayOrder(new Date().getDay()));
  return schedule.map((weekday) => {
    const date = new Date(week.find((item) => item.getDay() === weekday) ?? week[0]);
    if (moveToNextWeek) date.setDate(date.getDate() + 7);
    return date;
  });
}

function distributeWeekdays(count: number) {
  const patterns: Record<number, number[]> = {
    2: [2, 5],
    3: [1, 3, 5],
    4: [1, 2, 4, 6],
    5: [1, 2, 3, 5, 6],
    6: [1, 2, 3, 4, 5, 6],
  };
  return patterns[Math.min(6, Math.max(2, count))] ?? patterns[4];
}

function weekdayOrder(weekday: number) {
  return weekday === 0 ? 7 : weekday;
}

function findCurrentOrNextSession(schedule: number[], today: number) {
  const todayOrder = weekdayOrder(today);
  const next = schedule.findIndex((weekday) => weekdayOrder(weekday) >= todayOrder);
  return next >= 0 ? next : 0;
}

function narrowWeekday(date: Date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(date);
}

function shortWeekday(date?: Date) {
  return date ? new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date) : 'Day';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing['3xl'] + spacing['3xl'] },
  primaryText: { color: palette.onSurface },
  secondaryText: { color: palette.onSurfaceVariant },
  accentText: { color: palette.primary },
  selectedText: { color: palette.onPrimary },
  selectedSubtext: { color: palette.primaryContainer },
  heroActionText: { color: palette.onPrimary },
  copyTop: { marginTop: spacing.xs },
  sectionTop: { marginTop: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  headerCopy: { flex: 1 },
  profileButton: { width: spacing['2xl'], height: spacing['2xl'], borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  profileDot: { position: 'absolute', right: spacing.xs, bottom: spacing.xs, width: spacing.lg, height: spacing.lg, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary },
  heroImage: { width: '100%', aspectRatio: 1.7, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerHighest },
  heroContent: { padding: spacing.md },
  heroAction: { minHeight: spacing['2xl'], marginTop: spacing.md, borderRadius: radii.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.primary },
  metricSentence: { marginTop: spacing.lg, minHeight: spacing['3xl'], paddingHorizontal: spacing.md, borderRadius: radii.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: palette.surfaceContainerLow },
  metricMarker: { width: spacing.xs, height: spacing.xs, borderRadius: radii.pill, backgroundColor: palette.primary },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  briefDays: { gap: spacing.sm, marginTop: spacing.md },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  dayLabelBlock: { flex: 1, gap: spacing.xs },
  secondaryButton: { minHeight: spacing['2xl'], marginTop: spacing.md, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHighest },
  historyList: { gap: spacing.sm, marginTop: spacing.md },
  loading: { marginTop: spacing.lg },
  sheetHeroImage: { width: '100%', aspectRatio: 1.8, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerHighest },
  exerciseList: { gap: spacing.sm },
  exerciseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerHigh },
  exerciseImage: { width: spacing['3xl'], height: spacing['3xl'], borderRadius: radii.md, backgroundColor: palette.surfaceContainerHighest },
  generatedCopy: { flex: 1, gap: spacing.xs },
  instructionList: { gap: spacing.xs, marginTop: spacing.xs },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  instructionNumber: { width: spacing.lg, height: spacing.lg, textAlign: 'center', textAlignVertical: 'center', color: palette.onPrimary, backgroundColor: palette.primary, borderRadius: radii.pill, overflow: 'hidden' },
  instructionCopy: { flex: 1 },
  swapButton: { minHeight: spacing['2xl'], paddingHorizontal: spacing.sm, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: palette.surfaceContainerHighest },
  primaryButton: { minHeight: spacing['2xl'], marginTop: spacing.md, borderRadius: radii.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.primary },
  pressed: { opacity: 0.82 },
  textButton: { minHeight: spacing['2xl'], justifyContent: 'center', paddingHorizontal: spacing.sm },
  centeredButton: { alignItems: 'center' },
  flowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: spacing['2xl'], height: spacing['2xl'], borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  flowIntro: { marginTop: spacing.md },
  setupField: { marginTop: spacing.xl, gap: spacing.md },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  fieldTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  numberBadge: { width: spacing.xl, height: spacing.xl, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  locationChoice: { width: '48%', minHeight: spacing['3xl'] + spacing['3xl'], padding: spacing.sm, borderRadius: radii.lg, justifyContent: 'center', gap: spacing.sm, backgroundColor: palette.surfaceContainer },
  selectedChoice: { backgroundColor: palette.primary },
  segmentedRow: { flexDirection: 'row', gap: spacing.sm },
  segment: { flex: 1, minHeight: spacing['2xl'], borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  dayPicker: { flexDirection: 'row', gap: spacing.xs },
  dayChoice: { flex: 1, minHeight: spacing['3xl'], borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: palette.surfaceContainerHigh },
  fieldNote: { marginTop: spacing.xs },
  focusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  focusChoice: { width: '48%', minHeight: spacing['2xl'], paddingHorizontal: spacing.md, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  setupSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  totalBlock: { alignItems: 'flex-end' },
  planMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  metaPill: { minHeight: spacing.xl, paddingHorizontal: spacing.md, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  generatedWeek: { gap: spacing.sm, marginTop: spacing.md },
  generatedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateBlock: { width: spacing['2xl'], alignItems: 'center', gap: spacing.xs },
  planThumbnail: { width: spacing['3xl'], height: spacing['3xl'], borderRadius: radii.md, backgroundColor: palette.surfaceContainerHighest },
});
