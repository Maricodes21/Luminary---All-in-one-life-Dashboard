/**
 * Screen 9 of 10 — Personality tone.
 * Three coaching styles. Affects copy framing across the whole app.
 */

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { OnboardingProgress } from './_layout';

type ToneOption = {
  value: 'coach_hard' | 'gentle_nudges' | 'just_data';
  label: string;
  description: string;
};

const OPTIONS: ToneOption[] = [
  {
    value: 'coach_hard',
    label: 'Coach me hard',
    description: 'Direct. High expectations. You can handle it.',
  },
  {
    value: 'gentle_nudges',
    label: 'Gentle nudges',
    description: 'Warm. Observational. Never pushy.',
  },
  {
    value: 'just_data',
    label: 'Just the data',
    description: 'Minimal. Numbers and patterns only.',
  },
];

export default function PersonalityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toneProfile: saved, setToneProfile } = useOnboardingStore();
  const [selected, setSelected] = useState<ToneOption['value']>(saved ?? 'gentle_nudges');

  function advance() {
    setToneProfile(selected);
    router.push('/onboarding/ready');
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
      <OnboardingProgress step="personality" />

      <View style={styles.content}>
        <Text style={[t.headlineLg, styles.headline]}>How do you want to be spoken to?</Text>
        <Text style={[t.bodyMd, styles.sub]}>
          You can change this any time in settings.
        </Text>

        <View style={styles.options}>
          {OPTIONS.map((opt) => {
            const active = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setSelected(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={opt.label}
                style={[styles.optionCard, active && styles.optionCardActive]}
              >
                <Text
                  style={[
                    t.titleLg,
                    { color: active ? palette.primary : palette.onSurface },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[t.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}
                >
                  {opt.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={advance}
          accessibilityRole="button"
          accessibilityLabel="Continue to summary"
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={[t.titleMd, { color: palette.onPrimary }]}>Continue</Text>
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
  options: { gap: spacing.md },
  optionCard: {
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  optionCardActive: {
    backgroundColor: palette.primaryContainer,
  },
  actions: { paddingHorizontal: spacing.lg },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
