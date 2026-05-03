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

export default function ReadyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useOnboardingStore();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      await store.commitOnboarding();
      setOnboardingComplete(true);
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
            <Text style={[t.bodyMd, { color: palette.onSurface }]}>
              {goals.join(' · ')}
            </Text>
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
  actions: { paddingHorizontal: spacing.lg },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
