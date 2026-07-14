import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealScreen } from '@/components/meals/MealScreen';
import { parseOptionalNonnegative, parseRequiredNumber } from '@/lib/meals/formNumbers';
import { submitCommunityFood } from '@/lib/meals/search';

export default function SubmitFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(params.name ?? '');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const calorieValue = parseRequiredNumber(calories, 0, 100000);
    const quantityValue = parseRequiredNumber(quantity, 0.001, 100000);
    const macros = [parseOptionalNonnegative(protein), parseOptionalNonnegative(carbs), parseOptionalNonnegative(fat)];
    if (!name.trim() || !calorieValue.valid || !quantityValue.valid) {
      Alert.alert('Check the required details', 'Name, calories, and a positive serving quantity are required.');
      return;
    }
    if (macros.some((macro) => !macro.valid)) {
      Alert.alert('Check the macros', 'Macro values must be zero or greater, or left blank when unknown.');
      return;
    }
    setSubmitting(true);
    try {
      await submitCommunityFood({ proposedName: name.trim(), brand: brand.trim() || undefined, barcode: barcode.trim() || undefined, serving: { quantity: quantityValue.value, unit: unit.trim() || 'serving' }, nutrition: { calories: calorieValue.value, proteinG: macros[0].value, carbsG: macros[1].value, fatG: macros[2].value } });
      Alert.alert('Submitted for review', 'The record will become searchable after moderation. You can still log it manually now.', [{ text: 'Log now', onPress: () => router.replace({ pathname: '/meals/manual', params: { name, calories, protein, carbs, fat, notes: barcode ? `Barcode: ${barcode}` : undefined } }) }]);
    } catch {
      Alert.alert('Submission is waiting', 'The community service is unavailable right now. Use Manual entry and try the submission again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MealScreen title="Submit food" subtitle="Community records are moderated before search">
      <View style={styles.notice}><Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>Enter the label facts as printed. Unknown macros can stay blank; Luminary will not fill them in.</Text></View>
      <Field label="Food name" value={name} onChangeText={setName} placeholder="Product or food name" />
      <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="Optional" />
      <Field label="Barcode" value={barcode} onChangeText={setBarcode} placeholder="Optional" keyboardType="number-pad" />
      <View style={styles.row}><View style={styles.flex}><Field label="Quantity" value={quantity} onChangeText={setQuantity} placeholder="1" keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="Unit" value={unit} onChangeText={setUnit} placeholder="serving" /></View></View>
      <Field label="Calories" value={calories} onChangeText={setCalories} placeholder="Required" keyboardType="decimal-pad" />
      <View style={styles.row}><View style={styles.flex}><Field label="Protein g" value={protein} onChangeText={setProtein} placeholder="--" keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="Carbs g" value={carbs} onChangeText={setCarbs} placeholder="--" keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="Fat g" value={fat} onChangeText={setFat} placeholder="--" keyboardType="decimal-pad" /></View></View>
      <Pressable onPress={submit} disabled={submitting} style={[styles.button, submitting && { opacity: 0.6 }]}><Text style={[type.labelMd, { color: palette.onPrimary }]}>{submitting ? 'Submitting...' : 'Submit for review'}</Text></Pressable>
    </MealScreen>
  );
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'number-pad' | 'decimal-pad' }) { return <View style={styles.field}><Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={palette.onSurfaceVariant} /></View>; }
const styles = StyleSheet.create({
  notice: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  field: { gap: spacing.xs },
  input: { minHeight: 50, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm, paddingHorizontal: spacing.md, color: palette.onSurface, fontSize: 16 },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  button: { minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm },
});
