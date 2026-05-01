import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionLabel>Journal</SectionLabel>
      <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>Your digital sanctuary</Text>
      <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
        Capturing the whispers of your mind, one entry at a time.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
          Nothing here yet. Tonight could be the first one.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
});
