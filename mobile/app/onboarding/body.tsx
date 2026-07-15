/**
 * Screen 5 of 10 — Body.
 * Optional weight + height. Both in metric; unit conversion is a Phase 5 concern.
 * Skip allowed — these are used by Health module, which is opt-in anyway.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { NumberField } from '@/components/ui';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { OnboardingProgress } from './_layout';

export default function BodyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { weightKg: savedWeight, heightCm: savedHeight, setWeight, setHeight } =
    useOnboardingStore();

  const [weight, setWeightLocal] = useState(savedWeight?.toString() ?? '');
  const [height, setHeightLocal] = useState(savedHeight?.toString() ?? '');

  function advance() {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    setWeight(isFinite(w) && w > 0 ? w : undefined);
    setHeight(isFinite(h) && h > 0 ? h : undefined);
    router.push('/onboarding/workout');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
        <OnboardingProgress step="body" />

        <View style={styles.content}>
          <Text style={[t.headlineLg, styles.headline]}>A little about your body.</Text>
          <Text style={[t.bodyMd, styles.sub]}>
            Used by the Health module when you're ready for it. Completely optional.
          </Text>

          <View style={styles.row}>
            <View style={styles.field}>
              <NumberField
                label="Weight"
                value={weight}
                onChangeText={setWeightLocal}
                unit="kg"
                step={0.5}
                placeholder="70"
              />
            </View>
            <View style={styles.field}>
              <NumberField
                label="Height"
                value={height}
                onChangeText={setHeightLocal}
                unit="cm"
                step={1}
                placeholder="170"
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={advance}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={[t.titleMd, { color: palette.onPrimary }]}>Continue</Text>
          </Pressable>

          <Pressable
            onPress={() => { setWeight(undefined); setHeight(undefined); router.push('/onboarding/workout'); }}
            accessibilityRole="button"
            accessibilityLabel="Skip body measurements"
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={[t.bodyMd, { color: palette.onSurfaceVariant }]}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  row: { flexDirection: 'row', gap: spacing.md },
  field: { flex: 1 },
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
