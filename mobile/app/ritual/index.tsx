/**
 * Nightly ritual — stage orchestrator.
 *
 * Stages implemented:
 *   recap   (Stage 1) — Spotify recap card + loading/empty states
 *   mood    (Stage 2) — mood confirm/reject with Supabase write
 *   journal (Stage 3) — stub; full implementation Phase 2 Stage 3
 *   habits  (Stage 4) — stub; full implementation Phase 2 Stage 4
 *   summary           — navigates to /ritual/summary
 */
import { useEffect } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Icon } from '@/components/ui/Icon';
import { RecapCard } from '@/components/ritual/RecapCard';
import { MoodConfirm } from '@/components/ritual/MoodConfirm';
import { useSpotifyRecap } from '@/hooks/useSpotifyRecap';
import { useRitualStore } from '@/stores/useRitualStore';

export default function RitualScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { stage, setStage, reset } = useRitualStore();
  const { recap, isLoading, error, retry } = useSpotifyRecap();

  // Reset ephemeral state when the modal is first opened.
  // Running once on mount (no deps) is intentional.
  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMoodComplete(wantsJournal: boolean) {
    setStage(wantsJournal ? 'journal' : 'habits');
  }

  function handleClose() {
    reset();
    router.back();
  }

  // Navigate to summary screen when stage advances there.
  useEffect(() => {
    if (stage === 'summary') {
      router.push('/ritual/summary');
    }
  }, [stage, router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <View style={styles.topbar}>
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close ritual"
        >
          <Icon name="close" size={22} color={palette.onSurfaceVariant} />
        </Pressable>
        <SectionLabel>Tonight's ritual</SectionLabel>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Stage: recap + mood ──────────────────────────────────────────── */}
        {(stage === 'recap' || stage === 'mood') && (
          <>
            <Text style={[type.displayMd, { color: palette.onSurface }]}>
              How are you{' '}
              <Text style={{ color: palette.primary, fontStyle: 'italic' }}>really</Text>{' '}
              feeling?
            </Text>

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={palette.primary} size="large" />
                <Text style={[type.bodySm, styles.loadingText]}>
                  Loading your listening recap…
                </Text>
              </View>
            )}

            {!isLoading && error && (
              <Card>
                <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>{error}</Text>
                <Pressable
                  onPress={retry}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading recap"
                  style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.75 }]}
                >
                  <Text style={[type.titleMd, { color: palette.primary }]}>Try again</Text>
                </Pressable>
              </Card>
            )}

            {!isLoading && !error && recap === null && (
              <Card>
                <SectionLabel>Today's soundtrack</SectionLabel>
                <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
                  Nothing logged today.
                </Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
                  Listen to something tonight — we'll pick it up next time.
                </Text>
              </Card>
            )}

            {!isLoading && !error && recap && (
              <>
                <RecapCard recap={recap} />
                <MoodConfirm recap={recap} onComplete={handleMoodComplete} />
              </>
            )}

            {/* Allow skipping if empty or error state */}
            {!isLoading && (recap === null || error) && (
              <View style={styles.skipRow}>
                <Pressable
                  onPress={() => setStage('habits')}
                  accessibilityRole="button"
                  accessibilityLabel="Skip to habits"
                  style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.75 }]}
                >
                  <Text style={[type.titleMd, { color: palette.onSurfaceVariant }]}>
                    Continue without music
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* ── Stage: journal (stub) ────────────────────────────────────────── */}
        {stage === 'journal' && (
          <>
            <Text style={[type.displayMd, { color: palette.onSurface }]}>
              What surprised you today?
            </Text>
            <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>
              {/* TODO: tone-pass — journal prompt rotates; full implementation Stage 3 */}
              Journal coming in Stage 3.
            </Text>
            <Pressable
              onPress={() => setStage('habits')}
              accessibilityRole="button"
              accessibilityLabel="Continue to habits"
              style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={[type.titleMd, { color: palette.onPrimary }]}>Continue</Text>
            </Pressable>
          </>
        )}

        {/* ── Stage: habits (stub) ─────────────────────────────────────────── */}
        {stage === 'habits' && (
          <>
            <Text style={[type.displayMd, { color: palette.onSurface }]}>
              Today's habits
            </Text>
            <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>
              {/* TODO: tone-pass — habit check-in full implementation Stage 4 */}
              Habit check-in coming in Stage 4.
            </Text>
            <Pressable
              onPress={() => setStage('summary')}
              accessibilityRole="button"
              accessibilityLabel="Continue to night summary"
              style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={[type.titleMd, { color: palette.onPrimary }]}>Continue</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    color: palette.onSurfaceVariant,
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipRow: {
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  continueBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
    marginTop: spacing.md,
  },
});
