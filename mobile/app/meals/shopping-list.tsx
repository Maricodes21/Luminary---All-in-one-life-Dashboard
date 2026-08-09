import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { MealScreen } from '@/components/meals/MealScreen';
import { Icon } from '@/components/ui/Icon';
import { buildShoppingList, type ShoppingCategory } from '@/lib/meals/shoppingList';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

const categories: ShoppingCategory[] = ['Produce', 'Protein', 'Dairy', 'Pantry', 'Frozen', 'Other'];

export default function ShoppingListScreen() {
  const user = useMealsStore(activeMealsUser);
  const plan = user?.plans[0] ?? null;
  const items = useMemo(() => (plan ? buildShoppingList(plan) : []), [plan]);
  const [checked, setChecked] = useState<string[]>([]);
  const sections = categories
    .map((title) => ({ title, data: items.filter((item) => item.category === title) }))
    .filter((section) => section.data.length);
  return (
    <MealScreen
      title="Shopping list"
      subtitle={plan ? `${plan.title} · ${items.length} ingredients` : 'Build a meal plan first'}
    >
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[type.labelMd, styles.section]}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const done = checked.includes(item.id);
          return (
            <Pressable
              onPress={() =>
                setChecked((current) =>
                  current.includes(item.id)
                    ? current.filter((id) => id !== item.id)
                    : [...current, item.id],
                )
              }
              style={styles.row}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
            >
              <View style={[styles.check, done && styles.checkDone]}>
                {done ? <Icon name="check" size={16} color={palette.onPrimary} /> : null}
              </View>
              <View style={styles.copy}>
                <Text style={[type.titleMd, done ? styles.done : styles.title]}>{item.name}</Text>
                <Text style={[type.bodySm, styles.muted]}>
                  {formatQuantity(item.quantity, item.unit)} · used in {item.mealCount} meal
                  {item.mealCount === 1 ? '' : 's'}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[type.titleMd, styles.title]}>No ingredients yet</Text>
            <Text style={[type.bodySm, styles.muted]}>
              Generate a meal plan to build one combined list.
            </Text>
          </View>
        }
      />
    </MealScreen>
  );
}

function formatQuantity(quantity: number, unit: string) {
  return quantity ? `${quantity} ${unit}` : unit === 'item' ? 'As needed' : unit;
}
const styles = StyleSheet.create({
  section: { color: palette.primary, marginTop: spacing.md, marginBottom: spacing.xs },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceContainerLow,
    marginBottom: spacing.xs,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: palette.primary },
  copy: { flex: 1 },
  title: { color: palette.onSurface },
  done: { color: palette.onSurfaceVariant, textDecorationLine: 'line-through' },
  muted: { color: palette.onSurfaceVariant, marginTop: 2 },
  empty: { padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
});
