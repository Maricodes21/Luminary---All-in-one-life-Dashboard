import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { MealScreen } from '@/components/meals/MealScreen';
import { Icon } from '@/components/ui/Icon';
import { SelectField } from '@/components/ui';
import { localDateKey, mealWindowFor } from '@/lib/meals/dates';
import { makeUuid } from '@/lib/meals/state';
import { searchFoods } from '@/lib/meals/search';
import type { MealType } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

const units = ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'serving'];
type Part = { id: string; name: string; quantity: string; unit: string; calories: string; protein: string; carbs: string; fat: string };
const blank = (): Part => ({ id: makeUuid(), name: '', quantity: '100', unit: 'g', calories: '', protein: '', carbs: '', fat: '' });

export default function ManualMealPartsScreen() {
  const router = useRouter();
  const { draft } = useLocalSearchParams<{ draft?: string }>();
  const addMeal = useMealsStore((state) => state.addMeal);
  const user = useMealsStore(activeMealsUser);
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>(mealWindowFor(new Date()));
  const [parts, setParts] = useState<Part[]>(() => partsFromDraft(draft));
  const [searchingId, setSearchingId] = useState<string | null>(null);
  const totals = useMemo(() => parts.reduce((sum, part) => ({ calories: sum.calories + number(part.calories), protein: sum.protein + number(part.protein), carbs: sum.carbs + number(part.carbs), fat: sum.fat + number(part.fat) }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [parts]);
  const update = (id: string, field: keyof Part, value: string) => setParts((current) => current.map((part) => part.id === id ? { ...part, [field]: value } : part));

  async function findNutrition(part: Part) {
    if (part.name.trim().length < 2) return;
    setSearchingId(part.id);
    const locale = `en-${user?.profile?.countryCode ?? 'ZA'}`;
    const result = (await searchFoods(part.name, locale, user?.meals ?? []))[0];
    setSearchingId(null);
    const serving = result?.servings[0];
    const nutrition = serving?.nutrition ?? result?.nutrition;
    if (!result || !nutrition) { Alert.alert('No reliable match', 'Keep the amount and enter values from the food label or another trusted source.'); return; }
    setParts((current) => current.map((item) => item.id === part.id ? { ...item, name: result.name, quantity: String(serving?.quantity ?? 1), unit: serving?.unit ?? 'serving', calories: String(nutrition.calories), protein: nutrition.proteinG == null ? '' : String(nutrition.proteinG), carbs: nutrition.carbsG == null ? '' : String(nutrition.carbsG), fat: nutrition.fatG == null ? '' : String(nutrition.fatG) } : item));
  }

  function save() {
    if (parts.some((part) => !part.name.trim() || number(part.quantity) <= 0 || !part.calories.trim())) {
      Alert.alert('Complete each ingredient', 'Add its name, amount, unit, and calories. Macros can remain blank.');
      return;
    }
    const now = new Date();
    addMeal({
      id: makeUuid(), name: name.trim() || parts.map((part) => part.name.trim()).join(', '), localDate: localDateKey(now), consumedAt: now.toISOString(), timezone: timezone(), mealType,
      servingQuantity: 1, servingUnit: 'meal', source: 'manual',
      nutrition: { calories: totals.calories, proteinG: totals.protein, carbsG: totals.carbs, fatG: totals.fat },
      notes: `Ingredients: ${parts.map((part) => `${part.name.trim()} ${part.quantity} ${part.unit}`).join('; ')}`,
    });
    router.replace('/(tabs)/meals');
  }

  return <MealScreen title="Build from ingredients" subtitle="Transparent portions and totals" action={<Pressable onPress={save} style={styles.save}><Text style={[type.labelSm, styles.saveText]}>Save</Text></Pressable>}>
    <Text style={[type.bodySm, styles.muted]}>Use the values for the amount shown on each food label or trusted result. Luminary totals the parts without hiding its assumptions.</Text>
    <Field label="Meal name (optional)" value={name} onChangeText={setName} placeholder="Chicken, rice and broccoli" />
    <View style={styles.typeRow}>{(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((value) => <Pressable key={value} onPress={() => setMealType(value)} style={[styles.typeButton, mealType === value && styles.active]}><Text style={[type.labelSm, { color: mealType === value ? palette.onPrimary : palette.onSurfaceVariant }]}>{value}</Text></Pressable>)}</View>
    {parts.map((part, index) => <View key={part.id} style={styles.partCard}>
      <View style={styles.partHeader}><Text style={[type.titleMd, styles.title]}>Ingredient {index + 1}</Text>{parts.length > 1 ? <Pressable onPress={() => setParts((current) => current.filter((item) => item.id !== part.id))} accessibilityLabel={`Remove ingredient ${index + 1}`}><Icon name="trash" size={18} color={palette.error} /></Pressable> : null}</View>
      <Field label="Food" value={part.name} onChangeText={(value) => update(part.id, 'name', value)} placeholder="Chicken breast" />
      <Pressable onPress={() => void findNutrition(part)} disabled={searchingId === part.id || part.name.trim().length < 2} style={styles.find}><Icon name="search" size={17} color={palette.primary} /><Text style={[type.labelSm, { color: palette.primary }]}>{searchingId === part.id ? 'Finding…' : 'Find verified nutrition'}</Text></Pressable>
      <View style={styles.row}><View style={styles.flex}><Field label="Amount" value={part.quantity} onChangeText={(value) => update(part.id, 'quantity', value)} placeholder="100" numeric /></View><View style={styles.flex}><SelectField label="Unit" value={part.unit} options={units} onChange={(value) => update(part.id, 'unit', value)} allowCustom /></View></View>
      <View style={styles.row}><View style={styles.flex}><Field label="Calories" value={part.calories} onChangeText={(value) => update(part.id, 'calories', value)} placeholder="165" numeric /></View><View style={styles.flex}><Field label="Protein g" value={part.protein} onChangeText={(value) => update(part.id, 'protein', value)} placeholder="31" numeric /></View></View>
      <View style={styles.row}><View style={styles.flex}><Field label="Carbs g" value={part.carbs} onChangeText={(value) => update(part.id, 'carbs', value)} placeholder="0" numeric /></View><View style={styles.flex}><Field label="Fat g" value={part.fat} onChangeText={(value) => update(part.id, 'fat', value)} placeholder="3.6" numeric /></View></View>
    </View>)}
    <Pressable onPress={() => setParts((current) => [...current, blank()])} style={styles.add}><Icon name="plus" size={18} color={palette.primary} /><Text style={[type.labelMd, { color: palette.primary }]}>Add ingredient</Text></Pressable>
    <View style={styles.total}><Text style={[type.labelSm, styles.muted]}>MEAL TOTAL</Text><Text style={[type.headlineMd, styles.title]}>{Math.round(totals.calories)} kcal · {round(totals.protein)} g protein</Text><Text style={[type.bodySm, styles.muted]}>{round(totals.carbs)} g carbs · {round(totals.fat)} g fat</Text></View>
  </MealScreen>;
}

function Field({ label, numeric, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; numeric?: boolean }) { return <View style={styles.field}><Text style={[type.labelSm, styles.muted]}>{label}</Text><TextInput {...props} keyboardType={numeric ? 'decimal-pad' : 'default'} style={[type.bodyMd, styles.input]} placeholderTextColor={palette.onSurfaceVariant} /></View>; }
function number(value: string) { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0; }
function round(value: number) { return Math.round(value * 10) / 10; }
function timezone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } }
function partsFromDraft(value?: string): Part[] { try { const parsed = JSON.parse(value ?? '[]') as { name?: unknown; quantity?: unknown; unit?: unknown }[]; const parts = parsed.filter((item) => typeof item.name === 'string').slice(0, 12).map((item) => ({ ...blank(), name: String(item.name), quantity: String(item.quantity ?? '1'), unit: String(item.unit ?? 'serving') })); return parts.length ? parts : [blank()]; } catch { return [blank()]; } }

const styles = StyleSheet.create({
  save: { minHeight: 38, minWidth: 58, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: palette.primary }, saveText: { color: palette.onPrimary }, muted: { color: palette.onSurfaceVariant }, title: { color: palette.onSurface },
  field: { gap: spacing.xs }, input: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radii.sm, color: palette.onSurface, backgroundColor: palette.surfaceContainer },
  typeRow: { flexDirection: 'row', gap: spacing.xs }, typeButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: palette.surfaceContainer }, active: { backgroundColor: palette.primary },
  partCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerLow }, partHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, row: { flexDirection: 'row', gap: spacing.sm }, flex: { flex: 1, minWidth: 0 },
  add: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radii.md, backgroundColor: palette.primaryContainer }, total: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerHigh },
  find: { minHeight: 40, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.sm, backgroundColor: palette.primaryContainer },
});
