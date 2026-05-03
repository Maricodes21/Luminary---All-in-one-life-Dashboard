/**
 * Screen 2 of 10 — Account.
 * Email + password sign-up. ScrollView keeps the button above the keyboard.
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type as t } from '@luminary/design-system';
import { supabase } from '@/lib/supabase';
import { OnboardingProgress } from './_layout';

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp() {
    if (!email || !password) {
      setError('We need an email and password here.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    router.push('/onboarding/profile');
  }

  async function signIn() {
    if (!email || !password) {
      setError('We need an email and password here.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OnboardingProgress step="account" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[t.headlineLg, styles.headline]}>Create your account.</Text>

          <View style={styles.fields}>
            <View>
              <Text style={[t.labelMd, styles.label]}>email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholderTextColor={palette.onSurfaceVariant}
                placeholder="you@example.com"
                accessibilityLabel="Email address"
              />
            </View>
            <View>
              <Text style={[t.labelMd, styles.label]}>password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                placeholderTextColor={palette.onSurfaceVariant}
                placeholder="at least 8 characters"
                accessibilityLabel="Password"
              />
            </View>
          </View>

          {error ? (
            <Text style={[t.bodySm, styles.errorText]}>{error}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={signUp}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            {loading ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text style={[t.titleMd, { color: palette.onPrimary }]}>Continue</Text>
            )}
          </Pressable>

          <Pressable
            onPress={signIn}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign in to existing account"
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={[t.bodyMd, { color: palette.onSurfaceVariant }]}>
              Already have an account? Sign in.
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  headline: { color: palette.onSurface },
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
  errorText: {
    color: palette.error,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
