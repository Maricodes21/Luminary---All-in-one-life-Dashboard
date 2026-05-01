import { ScrollView, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Locked } from '@/components/ui/Locked';

export default function MoneyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionLabel>Money</SectionLabel>
      <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>Your spending, quietly tracked</Text>

      <Locked
        title="Open Money when you're ready"
        description="A monthly overview, four soft categories, and the bills that catch you off guard."
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
