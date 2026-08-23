import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [openCategories, setOpenCategories] = useState<ShoppingCategory[]>(['Produce']);
  const sections = categories
    .map((title) => ({ title, data: items.filter((item) => item.category === title) }))
    .filter((section) => section.data.length);
  return (
    <MealScreen
      title="Shopping list"
      subtitle={plan ? `${plan.title} · ${items.length} ingredients` : 'Build a meal plan first'}
    >
      {items.length ? (
        <>
          <View style={styles.stats}>
            <ShoppingStat value={`${items.length}`} label="items" />
            <ShoppingStat value={`${Math.max(0, items.length - checked.length)}`} label="left" />
            <ShoppingStat value={`${sections.length}`} label="sections" />
          </View>
          <View style={styles.categories}>
            {sections.map((section) => {
              const open = openCategories.includes(section.title);
              const completed = section.data.filter((item) => checked.includes(item.id)).length;
              return (
                <View key={section.title} style={styles.categoryCard}>
                  <Pressable
                    onPress={() =>
                      setOpenCategories((current) =>
                        current.includes(section.title)
                          ? current.filter((title) => title !== section.title)
                          : [...current, section.title],
                      )
                    }
                    style={styles.categoryHeader}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                  >
                    <View style={styles.copy}>
                      <Text style={[type.titleMd, styles.title]}>{section.title}</Text>
                      <Text style={[type.bodySm, styles.muted]}>
                        {completed}/{section.data.length} collected
                      </Text>
                    </View>
                    <Text style={[type.titleLg, styles.chevron]}>{open ? '−' : '+'}</Text>
                  </Pressable>
                  {open
                    ? section.data.map((item) => {
                        const done = checked.includes(item.id);
                        return (
                          <Pressable
                            key={item.id}
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
                              {done ? (
                                <Icon name="check" size={16} color={palette.onPrimary} />
                              ) : null}
                            </View>
                            <View style={styles.copy}>
                              <Text style={[type.titleMd, done ? styles.done : styles.title]}>
                                {item.name}
                              </Text>
                              <Text style={[type.bodySm, styles.muted]}>
                                {formatQuantity(item.quantity, item.unit)} · {item.mealCount} meal
                                {item.mealCount === 1 ? '' : 's'}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })
                    : null}
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={[type.titleMd, styles.title]}>No ingredients yet</Text>
          <Text style={[type.bodySm, styles.muted]}>
            Generate a meal plan to build one combined list.
          </Text>
        </View>
      )}
    </MealScreen>
  );
}

function ShoppingStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[type.headlineMd, styles.title]}>{value}</Text>
      <Text style={[type.labelSm, styles.muted]}>{label}</Text>
    </View>
  );
}

function formatQuantity(quantity: number, unit: string) {
  return quantity ? `${quantity} ${unit}` : unit === 'item' ? 'As needed' : unit;
}
const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceContainerLow,
  },
  categories: { gap: spacing.sm },
  categoryCard: {
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceContainerLow,
    overflow: 'hidden',
  },
  categoryHeader: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chevron: { color: palette.primary },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceContainer,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
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
