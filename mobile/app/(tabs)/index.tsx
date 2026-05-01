/**
 * Home — the calm "day surface."
 * Greets the user, shows today's habits + Friend Card observation, and
 * surfaces visible-but-locked previews of the other modules.
 *
 * The Home tab is intentionally NOT where the ritual happens. The ritual lives
 * behind the center FAB to keep this surface meditative.
 */
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Icon } from '@/components/ui/Icon';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>Welcome back</Text>
          <Text style={[type.headlineLg, { color: palette.primary, marginTop: 2 }]}>Luminary</Text>
        </View>
      </View>

      {/* Friend Card — daily editorial observation. Templates pre-MVP. */}
      <Card variant="recessed" style={styles.spaced}>
        <SectionLabel>Today's note</SectionLabel>
        <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
          A quiet start. The week is still yours.
        </Text>
      </Card>

      {/* Habits today — surfaces the ritual quietly */}
      <View style={styles.spaced}>
        <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Habits today</Text>
        <Card>
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
            Your habits live here. Tap the center button below to begin tonight's ritual.
          </Text>
        </Card>
      </View>

      {/* Locked module preview — Health */}
      <View style={styles.spaced}>
        <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Health</Text>
        <Card variant="recessed" style={styles.lockedRow}>
          <Icon name="lock" size={20} color={palette.onSurfaceVariant} />
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, flex: 1, marginLeft: spacing.sm }]}>
            Open this when you're ready.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  spaced: { marginTop: spacing.sm },
  lockedRow: { flexDirection: 'row', alignItems: 'center' },
});
