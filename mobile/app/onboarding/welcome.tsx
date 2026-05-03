/**
 * Screen 1 of 10 — Welcome.
 * Animated entrance. No data collected here.
 */

import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { OnboardingProgress } from './_layout';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <OnboardingProgress step="welcome" />

      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <Text style={[t.displayLg, styles.headline]}>
          Your evening{'\n'}starts here.
        </Text>
        <Text style={[t.bodyLg, styles.sub]}>
          A quiet ritual for people who want to know themselves better.
        </Text>
      </Animated.View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/onboarding/account')}
          accessibilityRole="button"
          accessibilityLabel="Get started"
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={[t.titleMd, { color: palette.onPrimary }]}>Get started</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  headline: {
    color: palette.onSurface,
  },
  sub: {
    color: palette.onSurfaceVariant,
  },
  actions: {
    paddingHorizontal: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
