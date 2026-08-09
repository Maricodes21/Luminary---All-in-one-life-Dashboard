import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { ExerciseVisual } from '@/components/health/ExerciseVisual';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { exerciseProgress, formatClock, secondsRemaining } from '@/lib/guidedWorkout';
import { useGuidedWorkoutStore } from '@/stores/useGuidedWorkoutStore';
import { useProductionStore } from '@/stores/useProductionStore';

export default function GuidedWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = useGuidedWorkoutStore((state) => state.active);
  const pauseWorkout = useGuidedWorkoutStore((state) => state.pauseWorkout);
  const resumeWorkout = useGuidedWorkoutStore((state) => state.resumeWorkout);
  const nextStep = useGuidedWorkoutStore((state) => state.nextStep);
  const previousStep = useGuidedWorkoutStore((state) => state.previousStep);
  const markLogged = useGuidedWorkoutStore((state) => state.markLogged);
  const clearWorkout = useGuidedWorkoutStore((state) => state.clearWorkout);
  const completeWorkout = useProductionStore((state) => state.completeWorkout);
  const [now, setNow] = useState(Date.now());
  const [reduceMotion, setReduceMotion] = useState(false);

  const step = active?.steps[active.currentStepIndex];
  const remaining = active && step?.mode === 'timer'
    ? secondsRemaining(active.stepEndsAt, active.remainingSeconds, now)
    : 0;
  const progress = active ? exerciseProgress(active.steps, active.currentStepIndex) : { completed: 0, total: 0 };
  const nextMeaningful = useMemo(() => active?.steps.slice(active.currentStepIndex + 1).find((candidate) => candidate.kind !== 'rest'), [active]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!active || active.status !== 'active' || active.isPaused || step?.mode !== 'timer') return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [active, step?.mode]);

  useEffect(() => {
    if (!active || active.status !== 'active' || active.isPaused || step?.mode !== 'timer' || remaining > 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    nextStep();
  }, [active, nextStep, remaining, step?.mode]);

  useEffect(() => {
    if (!active || active.status !== 'finished' || active.loggedAt) return;
    const durationMinutes = Math.max(1, Math.round((active.activeSeconds ?? 0) / 60));
    completeWorkout({
      title: active.session.title,
      workoutType: active.category,
      durationMinutes,
      notes: active.session.exercises.map((exercise) => exercise.name).join(', '),
    });
    markLogged();
  }, [active, completeWorkout, markLogged]);

  const leaveWorkout = () => {
    if (!active || active.status === 'finished') { router.back(); return; }
    Alert.alert('Pause this workout?', 'Your place will be saved so you can come back.', [
      { text: 'Keep moving', style: 'cancel' },
      { text: 'Pause and leave', onPress: () => { pauseWorkout(); router.back(); } },
    ]);
  };

  if (!active) {
    return <View style={[styles.empty, { paddingTop: insets.top + spacing.lg }]}><Icon name="health" size={32} color={palette.primary} /><Text style={[type.headlineMd, styles.primaryText]}>No workout is open</Text><Text style={[type.bodyMd, styles.secondaryText]}>Choose a day from your Health plan, then tap Start workout.</Text><ActionButton label="Back to Health" onPress={() => router.replace('/(tabs)/health')} /></View>;
  }

  if (active.status === 'finished') {
    return (
      <View style={[styles.finished, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.doneMark}><Icon name="check" size={32} color={palette.onPrimary} /></View>
        <SectionLabel>Workout complete</SectionLabel>
        <Text style={[type.displaySm, styles.primaryText, styles.center]}>{active.session.title}</Text>
        <Text style={[type.bodyMd, styles.secondaryText, styles.center]}>Saved to your movement history. Take a minute before the next thing.</Text>
        <View style={styles.finishStats}><Stat value={`${progress.total}`} label="sets" /><Stat value={`${active.skippedStepIds.length}`} label="skipped" /></View>
        <ActionButton label="Done" onPress={() => { clearWorkout(); router.replace('/(tabs)/health'); }} />
      </View>
    );
  }

  if (!step) return null;
  const timedProgress = step.durationSeconds ? remaining / step.durationSeconds : 0;

  return (
    <View style={styles.root}>
      <View style={[styles.topbar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={leaveWorkout} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Pause and leave workout"><Icon name="close" size={20} /></Pressable>
        <View style={styles.topbarCopy}><SectionLabel>{active.session.title}</SectionLabel><Text style={[type.bodySm, styles.secondaryText]}>{progress.completed} of {progress.total} sets done</Text></View>
        <Text style={[type.labelSm, styles.accentText]}>{Math.round(((active.currentStepIndex + 1) / active.steps.length) * 100)}%</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 160 }]} showsVerticalScrollIndicator={false}>
        <MovementPreview visualId={step.visualId ?? active.session.exercises[0]?.visualId ?? 'home_pushup'} animate={!reduceMotion && !active.isPaused && step.kind !== 'rest'} />
        <View style={styles.stepHeading}>
          <SectionLabel>{stepLabel(step.kind, step.setNumber, step.totalSets)}</SectionLabel>
          <Text style={[type.displaySm, styles.primaryText, styles.center]}>{step.title}</Text>
          <Text style={[type.bodyMd, styles.secondaryText, styles.center]}>{step.cue}</Text>
        </View>

        {step.mode === 'timer' ? (
          <TimerDial remaining={remaining} progress={timedProgress} paused={active.isPaused} />
        ) : (
          <View style={styles.manualCount}><Text style={[type.displayMd, styles.primaryText]}>{step.prescription}</Text><Text style={[type.bodySm, styles.secondaryText]}>Tap done when your set is complete.</Text></View>
        )}

        {nextMeaningful ? (
          <View style={styles.upNext}>
            <View><SectionLabel>Up next</SectionLabel><Text style={[type.titleLg, styles.primaryText, styles.copyTop]}>{nextMeaningful.title}</Text><Text style={[type.bodySm, styles.secondaryText]}>{nextMeaningful.prescription}</Text></View>
            {nextMeaningful.visualId ? <ExerciseVisual visualId={nextMeaningful.visualId} style={styles.nextImage} /> : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable onPress={previousStep} disabled={active.currentStepIndex === 0} style={[styles.smallControl, active.currentStepIndex === 0 && styles.disabled]} accessibilityRole="button"><Text style={[type.labelMd, styles.primaryText]}>Back</Text></Pressable>
        {step.mode === 'timer' ? (
          <Pressable onPress={active.isPaused ? resumeWorkout : pauseWorkout} style={styles.mainControl} accessibilityRole="button" accessibilityLabel={active.isPaused ? 'Resume timer' : 'Pause timer'}><Text style={[type.labelMd, styles.mainControlText]}>{active.isPaused ? 'Resume' : 'Pause'}</Text></Pressable>
        ) : (
          <Pressable onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); nextStep(); }} style={styles.mainControl} accessibilityRole="button"><Text style={[type.labelMd, styles.mainControlText]}>Set done</Text></Pressable>
        )}
        <Pressable onPress={() => nextStep(true)} style={styles.smallControl} accessibilityRole="button"><Text style={[type.labelMd, styles.accentText]}>{step.kind === 'rest' ? 'End rest' : 'Skip'}</Text></Pressable>
      </View>
    </View>
  );
}

function MovementPreview({ visualId, animate }: { visualId: string; animate: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pulse.stopAnimation();
    pulse.setValue(0);
    if (!animate) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [animate, pulse]);
  return <Animated.View style={[styles.visualFrame, { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) }] }]}><ExerciseVisual visualId={visualId} style={styles.visual} /></Animated.View>;
}

function TimerDial({ remaining, progress, paused }: { remaining: number; progress: number; paused: boolean }) {
  const size = 156; const stroke = 9; const radius = (size - stroke) / 2; const circumference = Math.PI * 2 * radius;
  return <View style={styles.timerWrap}><Svg width={size} height={size} style={styles.timerSvg}><Circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.surfaceContainerHighest} strokeWidth={stroke} fill="none" /><Circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.primary} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, progress)))} rotation="-90" origin={`${size / 2}, ${size / 2}`} /></Svg><Text style={[type.displayMd, styles.timerText]}>{formatClock(remaining)}</Text><Text style={[type.labelSm, styles.timerLabel]}>{paused ? 'Paused' : 'Remaining'}</Text></View>;
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.actionButton} accessibilityRole="button"><Text style={[type.labelMd, styles.mainControlText]}>{label}</Text></Pressable>; }
function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={[type.displaySm, styles.primaryText]}>{value}</Text><Text style={[type.labelSm, styles.secondaryText]}>{label}</Text></View>; }
function stepLabel(kind: string, set?: number, total?: number) { if (kind === 'exercise' && set && total) return `Set ${set} of ${total}`; if (kind === 'rest') return 'Recovery'; if (kind === 'warmup') return 'Get ready'; return 'Finish well'; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  topbar: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.outlineVariant },
  topbarCopy: { flex: 1, alignItems: 'center' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: palette.surfaceContainer },
  content: { padding: spacing.lg, gap: spacing.lg },
  visualFrame: { width: '100%', aspectRatio: 1.18, overflow: 'hidden', borderRadius: radii.xl, backgroundColor: palette.surfaceContainerHigh },
  visual: { width: '100%', height: '100%' },
  stepHeading: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  primaryText: { color: palette.onSurface }, secondaryText: { color: palette.onSurfaceVariant }, accentText: { color: palette.primary }, center: { textAlign: 'center' }, copyTop: { marginTop: spacing.xs },
  timerWrap: { width: 156, height: 156, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  timerSvg: { position: 'absolute' }, timerText: { color: palette.onSurface }, timerLabel: { color: palette.onSurfaceVariant, marginTop: -4 },
  manualCount: { minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.xl, backgroundColor: palette.surfaceContainer },
  upNext: { minHeight: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerLow },
  nextImage: { width: 76, height: 76, borderRadius: radii.md },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: palette.surfaceContainer },
  smallControl: { width: 72, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  mainControl: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: palette.primary }, mainControlText: { color: palette.onPrimary }, disabled: { opacity: 0.35 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: palette.surface },
  finished: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: palette.surface },
  doneMark: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 36, backgroundColor: palette.primary },
  finishStats: { width: '100%', flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md }, stat: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radii.lg, backgroundColor: palette.surfaceContainer },
  actionButton: { width: '100%', minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: palette.primary },
});
