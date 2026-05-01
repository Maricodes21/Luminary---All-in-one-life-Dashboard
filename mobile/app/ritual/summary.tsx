import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';

export default function RitualSummary() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={{ paddingHorizontal: spacing.md, gap: spacing.md, flex: 1 }}>
        <SectionLabel>Tonight</SectionLabel>
        <Text style={[type.displayMd, { color: palette.onSurface }]}>The day, distilled.</Text>

        <Card>
          <SectionLabel>Mood</SectionLabel>
          <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>Reflective</Text>
        </Card>
        <Card>
          <SectionLabel>Habits</SectionLabel>
          <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>3 of 3 captured</Text>
        </Card>
        <Card>
          <SectionLabel>Music</SectionLabel>
          <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>14 tracks · 52 min</Text>
        </Card>

        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.md }]}>
          See you tomorrow evening.
        </Text>

        <Pressable
          onPress={() => router.dismissAll()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={[type.titleMd, { color: palette.onPrimary }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  doneBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
  },
});
