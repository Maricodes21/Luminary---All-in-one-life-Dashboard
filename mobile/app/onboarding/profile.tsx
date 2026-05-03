/**
 * Screen 3 of 10 — Profile.
 * Display name (required) + optional pronouns.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { OnboardingProgress } from './_layout';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayName: savedName, pronouns: savedPronouns, setDisplayName, setPronouns } =
    useOnboardingStore();

  const [name, setName] = useState(savedName ?? '');
  const [pronouns, setPronounsLocal] = useState(savedPronouns ?? '');
  const [error, setError] = useState<string | null>(null);

  function advance() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('We need something to call you.');
      return;
    }
    setDisplayName(trimmed);
    setPronouns(pronouns.trim() || undefined);
    router.push('/onboarding/spotify');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
        <OnboardingProgress step="profile" />

        <View style={styles.content}>
          <Text style={[t.headlineLg, styles.headline]}>What should we call you?</Text>
          <Text style={[t.bodyMd, styles.sub]}>
            This is just for us. It shows up on your evening summary.
          </Text>

          <View style={styles.fields}>
            <View>
              <Text style={[t.labelMd, styles.label]}>name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => { setName(v); setError(null); }}
                autoCapitalize="words"
                autoComplete="name"
                placeholderTextColor={palette.onSurfaceVariant}
                placeholder="your name"
                accessibilityLabel="Display name"
              />
              {error ? (
                <Text style={[t.bodySm, styles.errorText]}>{error}</Text>
              ) : null}
            </View>

            <View>
              <Text style={[t.labelMd, styles.label]}>pronouns (optional)</Text>
              <TextInput
                style={styles.input}
                value={pronouns}
                onChangeText={setPronounsLocal}
                autoCapitalize="none"
                placeholderTextColor={palette.onSurfaceVariant}
                placeholder="e.g. she/her"
                accessibilityLabel="Pronouns, optional"
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={advance}
            accessibilityRole="button"
            accessibilityLabel="Continue to Spotify step"
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={[t.titleMd, { color: palette.onPrimary }]}>Continue</Text>
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
  fields: { gap: spacing.md },
  label: {
    color: palette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    color: palette.onSurface,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  errorText: { color: palette.error, marginTop: spacing.xs },
  actions: { paddingHorizontal: spacing.lg },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
