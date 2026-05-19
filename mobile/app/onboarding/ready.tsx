/**
 * Screen 10 of 10 — Ready.
 * Summary of what was set up. Commits everything to Supabase and routes to tabs.
 * TONE.md: "Your first evening is one tap away."
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { OnboardingProgress } from './_layout';

// ── Reminder time helpers ─────────────────────────────────────────────────────

const HOUR_OPTIONS = [18, 19, 20, 21, 22, 23] as const;
const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = String(minute).padStart(2, '0');
  const period = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${period}`;
}

export default function ReadyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useOnboardingStore();
  const { setOnboardingComplete, setDisplayName } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const reminderHour = store.reminderHour ?? 21;
  const reminderMinute = store.reminderMinute ?? 0;

  async function start() {
    setLoading(true);
    setError(null);
    try {
      await store.commitOnboarding();
      setOnboardingComplete(true);
      setDisplayName(store.displayName ?? null);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const habits = store.habitNames ?? [];
  const goals = store.goals ?? [];

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <OnboardingProgress step="ready" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[t.displayMd, styles.headline]}>
          You're{'\n'}all set.
        </Text>
        <Text style={[t.bodyLg, styles.sub]}>
          Your first evening is one tap away.
        </Text>

        {goals.length > 0 && (
          <View style={styles.summaryBlock}>
            <Text style={[t.labelMd, styles.summaryLabel]}>working toward</Text>
            {goals.map((g) => (
              <Text key={g} style={[t.bodyMd, { color: palette.onSurface }]}>{g}</Text>
            ))}
          </View>
        )}

        {habits.length > 0 && (
          <View style={styles.summaryBlock}>
            <Text style={[t.labelMd, styles.summaryLabel]}>starting with</Text>
            {habits.map((h) => (
              <Text key={h} style={[t.bodyMd, { color: palette.onSurface }]}>
                {h}
              </Text>
            ))}
          </View>
        )}

        {store.spotifyConnected && (
          <View style={styles.summaryBlock}>
            <Text style={[t.labelMd, styles.summaryLabel]}>mood signal</Text>
            <Text style={[t.bodyMd, { color: palette.onSurface }]}>
              Spotify connected
            </Text>
          </View>
        )}

        {/* Evening reminder time */}
        <View style={styles.summaryBlock}>
          <Text style={[t.labelMd, styles.summaryLabel]}>evening reminder</Text>
          <Pressable
            onPress={() => setShowTimePicker((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={`Evening reminder set to ${formatTime(reminderHour, reminderMinute)}. Tap to change.`}
            style={styles.timeRow}
          >
            <Text style={[t.bodyMd, { color: palette.onSurface }]}>
              {formatTime(reminderHour, reminderMinute)}
            </Text>
            <Text style={[t.bodySm, { color: palette.primary }]}>change</Text>
          </Pressable>

          {showTimePicker && (
            <View style={styles.timePicker}>
              <Text style={[t.labelMd, styles.summaryLabel]}>hour</Text>
              <View style={styles.timeOptions}>
                {HOUR_OPTIONS.map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => store.setReminderTime(h, reminderMinute)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${h}:00`}
                    accessibilityState={{ selected: reminderHour === h }}
                    style={[styles.timeChip, reminderHour === h && styles.timeChipSelected]}
                  >
                    <Text style={[t.bodySm, { color: reminderHour === h ? palette.primary : palette.onSurfaceVariant }]}>
                      {h}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[t.labelMd, styles.summaryLabel, { marginTop: spacing.sm }]}>minute</Text>
              <View style={styles.timeOptions}>
                {MINUTE_OPTIONS.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => store.setReminderTime(reminderHour, m)}
                    accessibilityRole="radio"
                    accessibilityLabel={`:${String(m).padStart(2, '0')}`}
                    accessibilityState={{ selected: reminderMinute === m }}
                    style={[styles.timeChip, reminderMinute === m && styles.timeChipSelected]}
                  >
                    <Text style={[t.bodySm, { color: reminderMinute === m ? palette.primary : palette.onSurfaceVariant }]}>
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        {error ? (
          <Text style={[t.bodySm, { color: palette.error }]}>{error}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={start}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Start your first evening"
          style={({ pressed }) => [styles.primaryBtn, loading && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
        >
          {loading ? (
            <ActivityIndicator color={palette.onPrimary} />
          ) : (
            <Text style={[t.titleMd, { color: palette.onPrimary }]}>
              Start your first evening
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headline: { color: palette.onSurface },
  sub: { color: palette.onSurfaceVariant },
  summaryBlock: {
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: {
    color: palette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timePicker: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHigh,
  },
  timeChipSelected: {
    backgroundColor: `${palette.primary}22`,
  },
  actions: { paddingHorizontal: spacing.lg },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
