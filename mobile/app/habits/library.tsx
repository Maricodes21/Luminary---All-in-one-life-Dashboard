import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { habitCategories, habitSuggestions, type HabitSuggestion } from '@/lib/modulePresets';
import { useProductionStore, type HabitSchedule } from '@/stores/useProductionStore';

const windowForCategory: Record<string, HabitSchedule['timeWindow']> = {
  Morning: 'morning', Body: 'day', Mind: 'anytime', Home: 'evening', Money: 'evening', Sleep: 'evening', Social: 'anytime',
};

export default function CommitmentLibrary() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('Morning');
  const habits = useProductionStore((state) => state.habits);
  const addHabit = useProductionStore((state) => state.addHabit);
  const suggestions = useMemo(() => habitSuggestions.filter((item) => item.category === category), [category]);

  function add(name: string, selectedCategory = category) {
    if (!name.trim() || habits.some((habit) => habit.name.toLowerCase() === name.trim().toLowerCase())) return;
    addHabit(name.trim(), {
      category: selectedCategory,
      schedule: { days: [0, 1, 2, 3, 4, 5, 6], timeWindow: windowForCategory[selectedCategory] ?? 'anytime', weeklyTarget: 5 },
    });
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Back"><Icon name="back" /></Pressable>
        <View style={styles.topbarTitle}><SectionLabel>Add commitment</SectionLabel><Text style={[type.bodySm, styles.muted]}>Start small, tune it later</Text></View>
        <View style={styles.topbarSpacer} />
      </View>

      <Text style={[type.displaySm, styles.title]}>Choose a promise{`\n`}that fits your day.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryStrip}>
        {habitCategories.map((item) => <Chip key={item} label={item} selected={item === category} onPress={() => setCategory(item)} />)}
      </ScrollView>

      <View style={styles.suggestionList}>
        {suggestions.map((suggestion) => <Suggestion key={suggestion.name} suggestion={suggestion} added={habits.some((habit) => habit.name.toLowerCase() === suggestion.name.toLowerCase())} onAdd={() => add(suggestion.name, suggestion.category)} />)}
      </View>

      <Pressable onPress={() => router.push('/habits/new')} style={styles.customCard} accessibilityRole="button" accessibilityLabel="Create your own commitment">
        <View style={styles.customIcon}><Icon name="edit" color={palette.primary} /></View>
        <View style={styles.customBody}><SectionLabel>Your own</SectionLabel><Text style={[type.titleLg, styles.title]}>Create a commitment</Text><Text style={[type.bodySm, styles.muted]}>Choose its category, days and place in your day.</Text></View>
        <Icon name="plus" color={palette.primary} />
      </Pressable>
    </ScrollView>
  );
}

function Suggestion({ suggestion, added, onAdd }: { suggestion: HabitSuggestion; added: boolean; onAdd: () => void }) {
  return (
    <Pressable onPress={onAdd} disabled={added} style={[styles.suggestion, added && styles.added]} accessibilityRole="button" accessibilityState={{ disabled: added }}>
      <View style={styles.suggestionIcon}><Icon name={suggestion.icon} color={palette.primary} /></View>
      <View style={styles.suggestionBody}><Text style={[type.titleMd, styles.title]}>{suggestion.name}</Text><Text style={[type.bodySm, styles.muted]}>{suggestion.detail}</Text></View>
      <View style={[styles.roundAdd, added && styles.roundAdded]}><Icon name={added ? 'check' : 'plus'} size={17} color={palette.onPrimary} /></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface }, content: { paddingHorizontal: spacing.md, gap: spacing.md },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topbarTitle: { alignItems: 'center' }, topbarSpacer: { width: 44 },
  iconButton: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  title: { color: palette.onSurface }, muted: { color: palette.onSurfaceVariant }, categoryStrip: { gap: spacing.sm }, suggestionList: { gap: spacing.sm },
  suggestion: { minHeight: 76, borderRadius: radii.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surfaceContainer }, added: { opacity: 0.58 },
  suggestionIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh }, suggestionBody: { flex: 1, gap: 2 },
  roundAdd: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary }, roundAdded: { backgroundColor: palette.tertiaryDim },
  customCard: { minHeight: 104, borderRadius: radii.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surfaceContainerHigh },
  customIcon: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primaryContainer },
  customBody: { flex: 1, gap: spacing.xs },
});
