import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { compactAiConfigured, compactAiModel } from '@/lib/ai/localGateway';
import { removePersistedReflection } from '@/lib/personalizationPersistence';
import { useProductionStore } from '@/stores/useProductionStore';
import { usePersonalizationStore } from '@/stores/usePersonalizationStore';

export default function PersonalizationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useProductionStore((state) => state.profileSettings);
  const habits = useProductionStore((state) => state.habits);
  const mealPlan = useProductionStore((state) => state.mealPlan);
  const workoutPlans = useProductionStore((state) => state.workoutPlans);
  const journalEntries = useProductionStore((state) => state.journalEntries);
  const reflections = usePersonalizationStore((state) => state.reflections);
  const deleteReflection = usePersonalizationStore((state) => state.deleteReflection);
  const activeCommitments = habits.filter(
    (habit) => !habit.activeUntil || habit.activeUntil >= new Date().toISOString().slice(0, 10),
  );

  function forgetReflection(id: string) {
    const reflection = reflections.find((item) => item.id === id);
    if (!reflection) return;
    deleteReflection(id);
    void removePersistedReflection(reflection);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Back to settings"
        >
          <Icon name="back" size={20} color={palette.onSurface} />
        </Pressable>
        <View style={styles.headerCopy}>
          <SectionLabel>Personalization</SectionLabel>
          <Text style={[type.displaySm, styles.title]}>What Luminary knows</Text>
        </View>
      </View>

      <Card variant="featured" style={styles.cardGap}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={[type.titleLg, styles.title]}>Compact AI</Text>
            <Text style={[type.bodySm, styles.copy]}>
              {compactAiConfigured()
                ? `${compactAiModel()} is available for optional reflections.`
                : 'Not connected. Luminary is using its private local rules.'}
            </Text>
          </View>
          <View style={[styles.statusDot, compactAiConfigured() && styles.statusDotOn]} />
        </View>
        <Text style={[type.bodySm, styles.copy]}>
          Listening facts stay in the recap. Only how you said the listening felt may shape an AI
          reflection.
        </Text>
      </Card>

      <KnowledgeGroup
        title="Your routine"
        rows={[
          `${activeCommitments.length} active commitment${activeCommitments.length === 1 ? '' : 's'}`,
          workoutPlans[0]
            ? `Current movement plan: ${workoutPlans[0].category} · ${workoutPlans[0].level}`
            : 'No movement plan yet',
          mealPlan.length
            ? `${mealPlan.length} planned meal day${mealPlan.length === 1 ? '' : 's'}`
            : 'No meal plan yet',
        ]}
      />

      <KnowledgeGroup
        title="Reflection context"
        rows={[
          `${journalEntries.filter((entry) => !entry.deletedAt).length} journal entries stay in your timeline`,
          settings.aiJournalText
            ? 'Journal text may be used in optional AI reflections'
            : 'Journal text is excluded; tags can still shape local prompts',
          settings.aiHealthContext ? 'Health context is allowed' : 'Health context is excluded',
          settings.aiMoneyContext ? 'Money context is allowed' : 'Money context is excluded',
        ]}
      />

      <Pressable
        onPress={() => router.push('/settings')}
        style={styles.primaryButton}
        accessibilityRole="button"
      >
        <Text style={[type.labelMd, styles.primaryText]}>Edit privacy choices</Text>
      </Pressable>

      {reflections.length ? (
        <View style={styles.section}>
          <SectionLabel>Saved reflections</SectionLabel>
          {reflections
            .filter((item) => item.status === 'accepted')
            .map((reflection) => (
              <Card key={reflection.id} style={styles.reflection}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex}>
                    <Text style={[type.titleMd, styles.title]}>{reflection.theme}</Text>
                    <Text style={[type.bodySm, styles.copy]}>
                      {reflection.localDate} · {reflection.evidenceCategories.join(' · ')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => forgetReflection(reflection.id)}
                    style={styles.deleteButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Forget ${reflection.theme} reflection`}
                  >
                    <Icon name="trash" size={18} color={palette.onSurfaceVariant} />
                  </Pressable>
                </View>
              </Card>
            ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function KnowledgeGroup({ title, rows }: { title: string; rows: string[] }) {
  return (
    <View style={styles.section}>
      <SectionLabel>{title}</SectionLabel>
      <Card style={styles.knowledgeCard}>
        {rows.map((row) => (
          <View key={row} style={styles.knowledgeRow}>
            <View style={styles.bullet} />
            <Text style={[type.bodyMd, styles.title, styles.flex]}>{row}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  cardGap: { gap: spacing.md },
  section: { gap: spacing.sm },
  knowledgeCard: { gap: spacing.md },
  knowledgeRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bullet: { width: 8, height: 8, borderRadius: radii.pill, backgroundColor: palette.primary },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  flex: { flex: 1 },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: palette.onSurfaceVariant,
  },
  statusDotOn: { backgroundColor: palette.tertiary },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: palette.primary,
  },
  reflection: { gap: spacing.sm },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  title: { color: palette.onSurface },
  copy: { color: palette.onSurfaceVariant, marginTop: spacing.xs },
  primaryText: { color: palette.onPrimary },
});
