import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealScreen } from '@/components/meals/MealScreen';
import { parseRequiredNumber } from '@/lib/meals/formNumbers';
import type { NutritionProfile } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

const goals = ['lose', 'maintain', 'gain'] as const;
const activities = ['low', 'moderate', 'high'] as const;
const sexes = ['female', 'male'] as const;

export default function NutritionProfileScreen() {
  const router = useRouter();
  const user = useMealsStore(activeMealsUser);
  const updateProfile = useMealsStore((state) => state.updateProfile);
  const current = user?.profile;
  const [dateOfBirth, setDateOfBirth] = useState(current?.dateOfBirth ?? '');
  const [weight, setWeight] = useState(current?.weightKg?.toString() ?? '');
  const [height, setHeight] = useState(current?.heightCm?.toString() ?? '');
  const [sex, setSex] = useState<NutritionProfile['biologicalSex']>(current?.biologicalSex ?? 'female');
  const [activity, setActivity] = useState<NutritionProfile['activityLevel']>(current?.activityLevel ?? 'moderate');
  const [goal, setGoal] = useState<NutritionProfile['goal']>(current?.goal ?? 'maintain');
  const [diet, setDiet] = useState((current?.dietaryPreferences ?? []).join(', '));
  const [allergies, setAllergies] = useState((current?.foodAllergies ?? []).join(', '));
  const [dislikes, setDislikes] = useState((current?.dislikedIngredients ?? []).join(', '));
  const [maxPrep, setMaxPrep] = useState(String(current?.maxPrepMinutes ?? 60));

  useEffect(() => {
    if (!current) return;
    setDateOfBirth(current.dateOfBirth);
    setWeight(String(current.weightKg));
    setHeight(String(current.heightCm));
    setSex(current.biologicalSex);
    setActivity(current.activityLevel);
    setGoal(current.goal);
    setDiet((current.dietaryPreferences ?? []).join(', '));
    setAllergies((current.foodAllergies ?? []).join(', '));
    setDislikes((current.dislikedIngredients ?? []).join(', '));
    setMaxPrep(String(current.maxPrepMinutes ?? 60));
  }, [current]);

  const save = () => {
    const weightKg = parseRequiredNumber(weight, 20, 500);
    const heightCm = parseRequiredNumber(height, 80, 260);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || Number.isNaN(new Date(`${dateOfBirth}T12:00:00`).getTime())) {
      Alert.alert('Check your birth date', 'Use YYYY-MM-DD, for example 1994-05-20.');
      return;
    }
    if (!weightKg.valid || !heightCm.valid) {
      Alert.alert('Check your measurements', 'Enter a weight from 20-500 kg and a height from 80-260 cm.');
      return;
    }
    const maxPrepMinutes = Number(maxPrep);
    if (!Number.isFinite(maxPrepMinutes) || maxPrepMinutes < 5 || maxPrepMinutes > 240) {
      Alert.alert('Check prep time', 'Choose a maximum from 5 to 240 minutes.');
      return;
    }
    updateProfile({
      dateOfBirth,
      biologicalSex: sex,
      activityLevel: activity,
      goal,
      heightCm: heightCm.value,
      weightKg: weightKg.value,
      updatedAt: new Date().toISOString(),
      dietaryPreferences: csv(diet),
      foodAllergies: csv(allergies),
      dislikedIngredients: csv(dislikes),
      maxPrepMinutes,
    });
    router.back();
  };

  return (
    <MealScreen title="Nutrition profile" subtitle="Your targets change when you do" action={<Pressable onPress={save} style={styles.save}><Text style={[type.labelSm, { color: palette.onPrimary }]}>Save</Text></Pressable>}>
      <View style={styles.intro}>
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>Your current weight updates future targets and is added to your private measurement history. Previous daily targets stay unchanged.</Text>
      </View>

      <Field label="Date of birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
      <View style={styles.row}>
        <View style={styles.flex}><Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="66" keyboardType="decimal-pad" /></View>
        <View style={styles.flex}><Field label="Height (cm)" value={height} onChangeText={setHeight} placeholder="168" keyboardType="decimal-pad" /></View>
      </View>
      <Choice label="Biological sex" values={sexes} value={sex} onChange={setSex} />
      <Choice label="Activity" values={activities} value={activity} onChange={setActivity} />
      <Choice label="Goal" values={goals} value={goal} onChange={setGoal} />
      <Field label="Dietary preferences" value={diet} onChangeText={setDiet} placeholder="vegan, gluten-free" />
      <Field label="Allergies" value={allergies} onChangeText={setAllergies} placeholder="peanut, shellfish" />
      <Field label="Ingredients to avoid" value={dislikes} onChangeText={setDislikes} placeholder="mushroom, coriander" />
      <Field label="Maximum prep time (minutes)" value={maxPrep} onChangeText={setMaxPrep} placeholder="60" keyboardType="decimal-pad" />

      {user?.measurements.length ? (
        <View style={styles.history}>
          <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Recent updates</Text>
          {user.measurements.slice(-3).reverse().map((measurement) => (
            <View key={measurement.id} style={styles.historyRow}>
              <Text style={[type.bodyMd, { color: palette.onSurface }]}>{measurement.weightKg} kg</Text>
              <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>{new Date(measurement.measuredAt).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </MealScreen>
  );
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'decimal-pad' | 'numbers-and-punctuation' }) {
  return <View style={styles.field}><Text style={[type.labelMd, styles.label]}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={palette.onSurfaceVariant} /></View>;
}

function Choice<T extends string>({ label, values, value, onChange }: { label: string; values: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.field}>
      <Text style={[type.labelMd, styles.label]}>{label}</Text>
      <View style={styles.choiceRow}>{values.map((item) => <Pressable key={item} onPress={() => onChange(item)} style={[styles.choice, item === value && styles.choiceActive]}><Text style={[type.labelSm, { color: item === value ? palette.onPrimary : palette.onSurfaceVariant }]}>{item}</Text></Pressable>)}</View>
    </View>
  );
}

function csv(value: string) {
  return value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

const styles = StyleSheet.create({
  save: { height: 38, minWidth: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm },
  intro: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  field: { gap: spacing.xs },
  label: { color: palette.onSurfaceVariant },
  input: { minHeight: 50, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm, paddingHorizontal: spacing.md, color: palette.onSurface, fontSize: 16 },
  choiceRow: { flexDirection: 'row', gap: spacing.sm },
  choice: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainer, borderRadius: radii.sm },
  choiceActive: { backgroundColor: palette.primary },
  history: { gap: spacing.sm, backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
