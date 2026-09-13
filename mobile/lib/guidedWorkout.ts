import type { PlannedExercise, WorkoutSession } from './workoutPlanning';

export type GuidedWorkoutStep = {
  id: string;
  kind: 'warmup' | 'exercise' | 'rest' | 'cooldown';
  title: string;
  cue: string;
  prescription: string;
  visualId?: string;
  mode: 'timer' | 'manual';
  durationSeconds?: number;
  exerciseIndex?: number;
  setNumber?: number;
  totalSets?: number;
};

export function buildGuidedWorkoutSteps(session: WorkoutSession): GuidedWorkoutStep[] {
  const steps: GuidedWorkoutStep[] = [];
  const warmupSeconds = minutesFrom(session.warmup) * 60;
  const warmups = warmupExercisesForSession(session);
  const secondsPerWarmup = Math.max(30, Math.floor(warmupSeconds / warmups.length));
  warmups.forEach((warmup, index) => steps.push({
    id: `${session.id}:warmup:${index}`,
    kind: 'warmup',
    title: warmup.title,
    cue: warmup.cue,
    prescription: formatDuration(secondsPerWarmup),
    mode: 'timer',
    durationSeconds: secondsPerWarmup,
    visualId: session.exercises[Math.min(index, session.exercises.length - 1)]?.visualId,
  }));

  const exerciseBudget = Math.max(60, session.durationMinutes * 60 - warmupSeconds - 120);
  const fallbackSeconds = Math.max(
    60,
    Math.floor(exerciseBudget / Math.max(1, session.exercises.length)),
  );
  session.exercises.forEach((exercise, exerciseIndex) => {
    const parsed = parseExercisePrescription(exercise, fallbackSeconds);
    steps.push({
      id: `${session.id}:${exercise.id}`,
      kind: 'exercise',
      title: exercise.name,
      cue: `${exercise.instructions.movement} ${exercise.instructions.breathing}`,
      prescription: parsed.sets > 1 ? `${parsed.sets} sets × ${parsed.label}` : parsed.label,
      visualId: exercise.visualId,
      mode: parsed.durationSeconds ? 'timer' : 'manual',
      ...(parsed.durationSeconds ? { durationSeconds: parsed.durationSeconds } : {}),
      exerciseIndex,
      totalSets: parsed.sets,
    });
    if (parsed.sets > 1 || exerciseIndex < session.exercises.length - 1) {
      const nextExercise = session.exercises[exerciseIndex + 1] ?? exercise;
      const durationSeconds = 30;
      steps.push({
        id: `${session.id}:${exercise.id}:rest`,
        kind: 'rest',
        title: 'Rest',
        cue: `Next: ${nextExercise.name}`,
        prescription: formatDuration(durationSeconds),
        visualId: nextExercise.visualId,
        mode: 'timer',
        durationSeconds,
      });
    }
  });

  const cooldownSeconds = Math.max(120, minutesFrom(session.cooldown) * 60);
  steps.push({
    id: `${session.id}:cooldown`,
    kind: 'cooldown',
    title: 'Cool down',
    cue: session.cooldown,
    prescription: formatDuration(cooldownSeconds),
    mode: 'timer',
    durationSeconds: cooldownSeconds,
    visualId: session.exercises.at(-1)?.visualId,
  });
  return steps;
}

export function warmupExercisesForSession(session: WorkoutSession) {
  const duration = minutesFrom(session.warmup);
  const source = session.warmup
    .replace(/^\d+(?:[\u2013-]\d+)?\s*min(?:utes?)?\s*(?:of\s*)?/i, '')
    .replace(/\.$/, '');
  const parts = source
    .split(/,|\band\b/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);
  const fallback = ['Easy movement', 'Joint preparation', 'Practice reps'];
  const movements = parts.length ? parts : fallback;
  return movements.map((movement) => ({
    title: movement.charAt(0).toUpperCase() + movement.slice(1),
    cue: `Move gently and use a comfortable range. This prepares you for ${session.title.toLowerCase()}.`,
    durationSeconds: Math.max(30, Math.floor((duration * 60) / movements.length)),
  }));
}

export function exerciseProgress(steps: GuidedWorkoutStep[], stepIndex: number) {
  const exerciseSteps = steps.filter((step) => step.kind === 'exercise');
  const completed = steps.slice(0, stepIndex).filter((step) => step.kind === 'exercise').length;
  return { completed, total: exerciseSteps.length };
}

export function secondsRemaining(endsAt: number | null, pausedSeconds: number, now = Date.now()) {
  return endsAt == null ? pausedSeconds : Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function parseExercisePrescription(exercise: PlannedExercise, fallbackSeconds: number) {
  const prescription = exercise.prescription.trim();
  const setMatch = prescription.match(/^(\d+)\s+sets?\s*[\u00d7x]\s*(.+)$/i);
  if (setMatch)
    return {
      sets: Number(setMatch[1]),
      label: setMatch[2],
      durationSeconds: durationFrom(setMatch[2]),
    };
  const intervalMatch = prescription.match(/^(\d+)\s*[\u00d7x]\s*(\d+)\s*sec/i);
  if (intervalMatch)
    return {
      sets: Number(intervalMatch[1]),
      label: `${intervalMatch[2]} sec`,
      durationSeconds: Number(intervalMatch[2]),
    };
  const duration = durationFrom(prescription);
  if (duration)
    return {
      sets: 1,
      label: prescription,
      durationSeconds: /each|side/i.test(prescription) ? duration * 2 : duration,
    };
  if (/breath|rep|round|attempt|each side/i.test(prescription))
    return { sets: 1, label: prescription, durationSeconds: undefined };
  return { sets: 1, label: prescription, durationSeconds: fallbackSeconds };
}

function durationFrom(value: string) {
  const seconds = value.match(/(\d+)(?:[\u2013-]\d+)?\s*sec/i);
  if (seconds) return Number(seconds[1]);
  const minutes = value.match(/(\d+)(?:[\u2013-]\d+)?\s*min/i);
  if (minutes) return Number(minutes[1]) * 60;
  return undefined;
}

function minutesFrom(value: string) {
  return Number(value.match(/(\d+)(?:[\u2013-]\d+)?\s*min/i)?.[1] ?? 2);
}

function formatDuration(seconds: number) {
  return seconds >= 60 && seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} sec`;
}
