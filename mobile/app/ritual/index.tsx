/**
 * Nightly ritual — entry. This is the heart of the product.
 *
 * Stages (Phase 2 implementation will expand each into its own component):
 *   1. Spotify recap card with mood estimate.
 *   2. Mood confirm: "That's about right" / "Not quite right" → mood chips.
 *   3. Optional journal prompt + free text + tags.
 *   4. Habit check-in with soft-streak feedback.
 *   5. Night summary → "See you tomorrow evening."
 */
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Icon } from '@/components/ui/Icon';

export default function RitualScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close ritual">
          <Icon name="close" size={22} color={palette.onSurfaceVariant} />
        </Pressable>
        <SectionLabel>Tonight's ritual</SectionLabel>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing['2xl'] }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[type.displayMd, { color: palette.onSurface }]}>
          How are you <Text style={{ color: palette.primary, fontStyle: 'italic' }}>really</Text> feeling?
        </Text>
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
          Take a moment to check in with yourself.
        </Text>

        <Card style={{ marginTop: spacing.md }}>
          <SectionLabel>Today's soundtrack</SectionLabel>
          <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
            Connect Spotify to see your listening recap.
          </Text>
          <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
            We'll estimate tonight's mood from what you listened to today. You always confirm.
          </Text>
        </Card>

        <Card>
          <SectionLabel>Mood</SectionLabel>
          <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
            Reflective · Peaceful · Drained · Anxious · Cloudy
          </Text>
          <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
            Mood chips arrive in Phase 2.
          </Text>
        </Card>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[type.titleMd, { color: palette.onSurfaceVariant }]}>Not tonight</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/ritual/summary')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={[type.titleMd, { color: palette.onPrimary }]}>Continue</Text>
          </Pressable>
        </View>
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
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  skipBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
  },
  continueBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
  },
});
