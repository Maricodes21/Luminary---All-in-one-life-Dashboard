/**
 * HabitCheckin — Stage 4 of the ritual.
 *
 * Loads the user's active habits + today's completions + last-7-days history
 * in one parallel Supabase call. Tap-to-complete is optimistic (local state
 * updates instantly, DB write happens async). Streak band recalculates after
 * every toggle.
 *
 * "Tomorrow" section: lightweight toggles that write to habit_pauses so the
 * user can soft-skip a habit for the next day without archiving it.
 */
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { supabase } from '@/lib/supabase';
import {
  writeHabitCompletion,
  deleteHabitCompletion,
  writeHabitPause,
  deleteHabitPause,
} from '@/lib/ritual';
import { calculateBand, bandCopy } from '@/lib/streak';
import { useRitualStore } from '@/stores/useRitualStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type Habit = { id: string; name: string; icon: string | null; position: number };

// ─── Date helpers (local to this file) ───────────────────────────────────────

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HabitCheckin() {
  const { toggleHabit, setTotalHabits, setStage } = useRitualStore();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [pausedTomorrow, setPausedTomorrow] = useState<Set<string>>(new Set());
  // All unique dates in the past 7 days that had at least one completion.
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = toIso(new Date());
  const tomorrow = toIso(addDays(new Date(), 1));

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const sevenDaysAgo = toIso(addDays(new Date(), -6));

      const [habitsRes, todayRes, pausesRes, historyRes] = await Promise.all([
        supabase
          .from('habits')
          .select('id, name, icon, position')
          .is('archived_at', null)
          .order('position'),
        supabase
          .from('habit_completions')
          .select('habit_id')
          .eq('completed_on', today),
        supabase
          .from('habit_pauses')
          .select('habit_id')
          .eq('pause_date', tomorrow),
        supabase
          .from('habit_completions')
          .select('completed_on')
          .gte('completed_on', sevenDaysAgo),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (todayRes.error) throw todayRes.error;
      if (pausesRes.error) throw pausesRes.error;
      if (historyRes.error) throw historyRes.error;

      const loadedHabits = (habitsRes.data ?? []) as Habit[];
      setHabits(loadedHabits);
      setTotalHabits(loadedHabits.length);

      setCompletedToday(new Set((todayRes.data ?? []).map((r) => r.habit_id as string)));
      setPausedTomorrow(new Set((pausesRes.data ?? []).map((r) => r.habit_id as string)));
      setCompletedDates(new Set((historyRes.data ?? []).map((r) => r.completed_on as string)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[HabitCheckin] load error', msg);
      setError("We couldn't load your habits. Try closing and reopening.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle(habitId: string) {
    const wasCompleted = completedToday.has(habitId);

    // Optimistic update.
    const next = new Set(completedToday);
    if (wasCompleted) {
      next.delete(habitId);
    } else {
      next.add(habitId);
    }
    setCompletedToday(next);
    toggleHabit(habitId);

    // Update date-level set for band calculation.
    const nextDates = new Set(completedDates);
    if (wasCompleted && next.size === 0) {
      nextDates.delete(today);
    } else if (!wasCompleted) {
      nextDates.add(today);
    }
    setCompletedDates(nextDates);

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (wasCompleted) {
        await deleteHabitCompletion(habitId);
      } else {
        await writeHabitCompletion(habitId);
      }
    } catch (err: unknown) {
      // Roll back optimistic update on failure.
      setCompletedToday(completedToday);
      setCompletedDates(completedDates);
      console.warn('[HabitCheckin] toggle error', err);
    }
  }

  async function handlePauseToggle(habitId: string) {
    const wasPaused = pausedTomorrow.has(habitId);
    const next = new Set(pausedTomorrow);
    if (wasPaused) {
      next.delete(habitId);
    } else {
      next.add(habitId);
    }
    setPausedTomorrow(next);

    try {
      if (wasPaused) {
        await deleteHabitPause(habitId);
      } else {
        await writeHabitPause(habitId);
      }
    } catch (err: unknown) {
      setPausedTomorrow(pausedTomorrow);
      console.warn('[HabitCheckin] pause toggle error', err);
    }
  }

  // ── Band ──────────────────────────────────────────────────────────────────

  const window = calculateBand(
    [...completedDates].map((date) => ({ date })),
  );
  const bandText = bandCopy(window.band, window.daysHit);

  // ── Loading / error ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>{error}</Text>
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
          Pick something small. Three is enough.
        </Text>
        <Pressable
          onPress={() => setStage('summary')}
          accessibilityRole="button"
          accessibilityLabel="Continue to summary"
          style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={[type.titleMd, { color: palette.onPrimary }]}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Today ────────────────────────────────────────────────────────── */}
      <Text style={[type.displayMd, { color: palette.onSurface }]}>Today's habits</Text>

      <View style={styles.habitList}>
        {habits.map((habit) => {
          const done = completedToday.has(habit.id);
          return (
            <Pressable
              key={habit.id}
              onPress={() => handleToggle(habit.id)}
              accessibilityRole="checkbox"
              accessibilityLabel={habit.name}
              accessibilityState={{ checked: done }}
              style={({ pressed }) => [
                styles.habitRow,
                done && styles.habitRowDone,
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={[styles.checkbox, done && styles.checkboxDone]} />
              <Text
                style={[
                  type.bodyMd,
                  { color: done ? palette.onSurfaceVariant : palette.onSurface },
                  done && styles.strikethrough,
                ]}
              >
                {habit.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[type.bodySm, styles.bandText]}>{bandText}</Text>

      {/* ── Tomorrow ─────────────────────────────────────────────────────── */}
      <Card variant="recessed" style={styles.tomorrowCard}>
        <SectionLabel>Tomorrow</SectionLabel>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
          Anything you'd like to skip tomorrow?
        </Text>
        <View style={styles.tomorrowList}>
          {habits.map((habit) => {
            const paused = pausedTomorrow.has(habit.id);
            return (
              <Pressable
                key={habit.id}
                onPress={() => handlePauseToggle(habit.id)}
                accessibilityRole="switch"
                accessibilityLabel={`${habit.name} — ${paused ? 'paused tomorrow' : 'active tomorrow'}`}
                accessibilityState={{ checked: paused }}
                style={({ pressed }) => [styles.tomorrowRow, pressed && { opacity: 0.75 }]}
              >
                <Text style={[type.bodyMd, { color: paused ? palette.onSurfaceVariant : palette.onSurface }]}>
                  {habit.name}
                </Text>
                <View style={[styles.tomorrowToggle, paused && styles.tomorrowTogglePaused]}>
                  <Text style={[type.labelSm, { color: paused ? palette.onSurfaceVariant : palette.primary }]}>
                    {paused ? 'skipping' : 'on'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Pressable
        onPress={() => setStage('summary')}
        accessibilityRole="button"
        accessibilityLabel="Continue to night summary"
        style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={[type.titleMd, { color: palette.onPrimary }]}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  centered: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  habitList: { gap: spacing.sm },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceContainer,
    borderRadius: radii.md,
    minHeight: 52,
  },
  habitRowDone: {
    backgroundColor: palette.surfaceContainerLow,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.onSurfaceVariant,
  },
  checkboxDone: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  bandText: {
    color: palette.onSurfaceVariant,
    paddingHorizontal: spacing.xs,
  },
  tomorrowCard: { gap: spacing.sm },
  tomorrowList: { gap: spacing.xs, marginTop: spacing.xs },
  tomorrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  tomorrowToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: `${palette.primary}18`,
  },
  tomorrowTogglePaused: {
    backgroundColor: palette.surfaceContainerHigh,
  },
  continueBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
  },
});
