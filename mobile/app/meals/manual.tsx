import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealScreen } from '@/components/meals/MealScreen';
import { Icon } from '@/components/ui/Icon';
import { NumberField, SelectField } from '@/components/ui';
import { localDateKey, mealWindowFor } from '@/lib/meals/dates';
import { parseOptionalNonnegative, parseRequiredNumber } from '@/lib/meals/formNumbers';
import { makeUuid } from '@/lib/meals/state';
import type { MealSource, MealType } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

const servingUnits = ['serving', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice'];

export default function ManualMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; imageUri?: string; calories?: string; protein?: string; carbs?: string; fat?: string; providerId?: string; source?: string; notes?: string; quantity?: string; unit?: string; mealType?: string }>();
  const user = useMealsStore(activeMealsUser);
  const existing = useMemo(() => user?.meals.find((meal) => meal.id === params.id), [params.id, user?.meals]);
  const addMeal = useMealsStore((state) => state.addMeal);
  const updateMeal = useMealsStore((state) => state.updateMeal);
  const [name, setName] = useState(existing?.name ?? params.name ?? '');
  const [calories, setCalories] = useState(existing?.nutrition.calories?.toString() ?? params.calories ?? '');
  const [protein, setProtein] = useState(existing?.nutrition.proteinG?.toString() ?? params.protein ?? '');
  const [carbs, setCarbs] = useState(existing?.nutrition.carbsG?.toString() ?? params.carbs ?? '');
  const [fat, setFat] = useState(existing?.nutrition.fatG?.toString() ?? params.fat ?? '');
  const [quantity, setQuantity] = useState(existing?.servingQuantity?.toString() ?? params.quantity ?? '1');
  const [unit, setUnit] = useState(existing?.servingUnit ?? params.unit ?? 'serving');
  const [notes, setNotes] = useState(existing?.notes ?? params.notes ?? '');
  const [mealType, setMealType] = useState<MealType>(existing?.mealType ?? (isMealType(params.mealType) ? params.mealType : mealWindowFor(new Date())));
  const imageUri = existing?.imageUri ?? params.imageUri;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [imageUri]);

  const save = () => {
    const calorieValue = parseRequiredNumber(calories, 0, 100000);
    const quantityValue = parseRequiredNumber(quantity, 0.001, 100000);
    const macros = [parseOptionalNonnegative(protein), parseOptionalNonnegative(carbs), parseOptionalNonnegative(fat)];
    if (!name.trim() || !calorieValue.valid) {
      Alert.alert('Name and calories are required', 'Macros can stay blank when you do not know them.');
      return;
    }
    if (!quantityValue.valid || !unit.trim()) {
      Alert.alert('Check the serving', 'Add a positive quantity and serving unit.');
      return;
    }
    if (macros.some((macro) => !macro.valid)) {
      Alert.alert('Check the macros', 'Macro values must be zero or greater, or left blank when unknown.');
      return;
    }
    const now = new Date();
    const record = {
      name: name.trim(), localDate: existing?.localDate ?? localDateKey(now), consumedAt: existing?.consumedAt ?? now.toISOString(),
      timezone: existing?.timezone ?? currentTimezone(), mealType, servingQuantity: quantityValue.value, servingUnit: unit.trim(),
      nutrition: { calories: calorieValue.value, proteinG: macros[0].value, carbsG: macros[1].value, fatG: macros[2].value },
      source: (existing?.source ?? (isMealSource(params.source) ? params.source : 'manual')) as MealSource,
      providerId: existing?.providerId ?? params.providerId, notes: notes.trim() || undefined, imageUri,
    };
    if (existing) updateMeal(existing.id, record);
    else addMeal({ id: makeUuid(), ...record });
    router.replace('/(tabs)/meals');
  };

  return (
    <MealScreen title={existing ? 'Edit meal' : 'Manual entry'} subtitle="Add as much detail as you know" action={<Pressable onPress={save} style={styles.save}><Text style={[type.labelSm, { color: palette.onPrimary }]}>Save</Text></Pressable>}>
      <Field label="Food or meal name" value={name} onChangeText={setName} placeholder="Chicken wrap" />
      <Field label="Calories" value={calories} onChangeText={setCalories} placeholder="420" keyboardType="decimal-pad" />
      <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Meal</Text>
      <View style={styles.typeRow}>{(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((item) => <Pressable key={item} onPress={() => setMealType(item)} style={[styles.typeButton, mealType === item && styles.active]}><Text style={[type.labelSm, { color: mealType === item ? palette.onPrimary : palette.onSurfaceVariant }]}>{item}</Text></Pressable>)}</View>
      <View style={styles.twoColumns}><View style={styles.flex}><NumberField label="Quantity" value={quantity} onChangeText={setQuantity} min={0.001} max={100000} step={0.25} placeholder="1" /></View><View style={styles.flex}><SelectField label="Unit" value={unit} options={servingUnits} onChange={setUnit} allowCustom /></View></View>
      <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Macros (optional)</Text>
      <View style={styles.threeColumns}><View style={styles.flex}><Field label="Protein g" value={protein} onChangeText={setProtein} placeholder="--" keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="Carbs g" value={carbs} onChangeText={setCarbs} placeholder="--" keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="Fat g" value={fat} onChangeText={setFat} placeholder="--" keyboardType="decimal-pad" /></View></View>
      <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Sauce on the side, half portion..." multiline />
      {imageUri && !imageFailed ? <Image source={{ uri: imageUri }} style={styles.photo} onError={() => setImageFailed(true)} /> : <Pressable onPress={() => router.push({ pathname: '/meals/camera', params: { purpose: 'attachment', returnId: params.id, returnName: name, returnCalories: calories, returnProtein: protein, returnCarbs: carbs, returnFat: fat, returnQuantity: quantity, returnUnit: unit, returnMealType: mealType, returnNotes: notes, returnProviderId: params.providerId, returnSource: params.source } })} style={styles.cameraButton}><Icon name="camera" size={20} color={palette.primary} /><Text style={[type.labelMd, { color: palette.onSurface }]}>{imageFailed ? 'Take another photo' : 'Take a photo'}</Text></Pressable>}
    </MealScreen>
  );
}

function Field({ label, multiline, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'decimal-pad'; multiline?: boolean }) {
  return <View style={styles.field}><Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>{label}</Text><TextInput {...props} multiline={multiline} style={[styles.input, multiline && styles.notes]} placeholderTextColor={palette.onSurfaceVariant} /></View>;
}

function isMealSource(value?: string): value is MealSource { return value === 'manual' || value === 'curated' || value === 'usda' || value === 'open_food_facts' || value === 'community' || value === 'commercial' || value === 'ai_vision'; }
function isMealType(value?: string): value is MealType { return value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack'; }
function currentTimezone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } }

const styles = StyleSheet.create({
  save: { height: 38, minWidth: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm },
  field: { gap: spacing.xs },
  input: { minHeight: 50, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm, paddingHorizontal: spacing.md, color: palette.onSurface, fontSize: 16 },
  notes: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: spacing.xs },
  typeButton: { flex: 1, minWidth: 0, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: palette.surfaceContainer },
  active: { backgroundColor: palette.primary },
  twoColumns: { flexDirection: 'row', gap: spacing.sm },
  threeColumns: { flexDirection: 'row', gap: spacing.xs },
  flex: { flex: 1, minWidth: 0 },
  cameraButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radii.sm, backgroundColor: palette.surfaceContainer },
  photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: radii.sm },
});
