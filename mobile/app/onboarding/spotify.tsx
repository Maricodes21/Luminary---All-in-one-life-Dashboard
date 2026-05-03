/**
 * Screen 4 of 10 — Spotify connect.
 * Explains what data we use, offers PKCE connect, and allows skipping.
 * "Not quite right" is the brand-mandated reject CTA (TONE.md).
 */

import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { OnboardingProgress } from './_layout';

export default function SpotifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { connect, isConnected, isLoading, error, ready } = useSpotifyAuth();
  const { setSpotifyConnected } = useOnboardingStore();

  function advance(connected: boolean) {
    setSpotifyConnected(connected);
    router.push('/onboarding/body');
  }

  if (isConnected) {
    // Auto-advance once connected.
    advance(true);
    return null;
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <OnboardingProgress step="spotify" />

      <View style={styles.content}>
        <Text style={[t.headlineLg, styles.headline]}>
          Your music knows{'\n'}something.
        </Text>
        <Text style={[t.bodyMd, styles.sub]}>
          We read your listening history to estimate tonight's mood — valence and energy, translated into feeling. You always confirm what we find.
        </Text>
        <Text style={[t.bodyMd, styles.sub]}>
          We never store your listening history beyond the nightly snapshot.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={[t.bodySm, { color: palette.error }]}>{error}</Text>
            <Text style={[t.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
              Spotify needs a quick reconnect. We'll wait.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={connect}
          disabled={!ready || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Connect Spotify"
          style={({ pressed }) => [
            styles.primaryBtn,
            (!ready || isLoading) && { opacity: 0.6 },
            pressed && { opacity: 0.85 },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={palette.onPrimary} />
          ) : (
            <Text style={[t.titleMd, { color: palette.onPrimary }]}>Connect Spotify</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => advance(false)}
          accessibilityRole="button"
          accessibilityLabel="Skip Spotify connection"
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={[t.bodyMd, { color: palette.onSurfaceVariant }]}>
            Not quite right
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  headline: { color: palette.onSurface },
  sub: { color: palette.onSurfaceVariant },
  errorBox: {
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  actions: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
