import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Locked } from '@/components/ui/Locked';

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionLabel>Physical health</SectionLabel>
      <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>Movement</Text>
      <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
        Your body in your own words.
      </Text>

      <Locked
        title="Open Health when you're ready"
        description="We'll start with your steps and a daily movement card. Connect Apple Health or Google Fit to begin."
        cta="Begin"
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
});
