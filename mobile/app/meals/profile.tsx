import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealScreen } from '@/components/meals/MealScreen';
import {
  AutocompleteField,
  ChoiceGroup,
  DateField,
  MultiChoiceField,
  NumberField,
} from '@/components/ui';
import { parseRequiredNumber } from '@/lib/meals/formNumbers';
import type { NutritionProfile } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

const goals: NutritionProfile['goal'][] = ['lose', 'maintain', 'gain'];
const activities: NutritionProfile['activityLevel'][] = ['low', 'moderate', 'high'];
const sexes: NutritionProfile['biologicalSex'][] = ['female', 'male'];
const goalOptions = goals.map((value) => ({ value, label: value }));
const activityOptions = activities.map((value) => ({ value, label: value }));
const sexOptions = sexes.map((value) => ({ value, label: value }));
const dietChoices = ['vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 'halal'];
const allergyChoices = [
  'fish',
  'shellfish',
  'peanut',
  'tree nuts',
  'dairy',
  'egg',
  'soy',
  'wheat/gluten',
  'sesame',
];
const ingredientSuggestions = [
  'mushroom',
  'coriander',
  'onion',
  'garlic',
  'tomato',
  'chili',
  'sesame',
];
const prepTimeOptions = [15, 30, 45, 60, 90].map((value) => ({ value, label: `${value} min` }));
const countryOptions = [
  { value: 'ZA', label: 'South Africa' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
];

export default function NutritionProfileScreen() {
  const router = useRouter();
  const user = useMealsStore(activeMealsUser);
  const updateProfile = useMealsStore((state) => state.updateProfile);
  const current = user?.profile;
  const [dateOfBirth, setDateOfBirth] = useState(current?.dateOfBirth ?? '');
  const [weight, setWeight] = useState(current?.weightKg?.toString() ?? '');
  const [height, setHeight] = useState(current?.heightCm?.toString() ?? '');
  const [sex, setSex] = useState<NutritionProfile['biologicalSex']>(
    current?.biologicalSex ?? 'female',
  );
  const [activity, setActivity] = useState<NutritionProfile['activityLevel']>(
    current?.activityLevel ?? 'moderate',
  );
  const [goal, setGoal] = useState<NutritionProfile['goal']>(current?.goal ?? 'maintain');
  const [diet, setDiet] = useState(current?.dietaryPreferences ?? []);
  const [allergies, setAllergies] = useState(current?.foodAllergies ?? []);
  const [dislikes, setDislikes] = useState((current?.dislikedIngredients ?? []).join(', '));
  const [maxPrep, setMaxPrep] = useState(current?.maxPrepMinutes ?? 60);
  const [countryCode, setCountryCode] = useState(current?.countryCode ?? deviceCountry());

  useEffect(() => {
    if (!current) return;
    setDateOfBirth(current.dateOfBirth);
    setWeight(String(current.weightKg));
    setHeight(String(current.heightCm));
    setSex(current.biologicalSex);
    setActivity(current.activityLevel);
    setGoal(current.goal);
    setDiet(current.dietaryPreferences ?? []);
    setAllergies(current.foodAllergies ?? []);
    setDislikes((current.dislikedIngredients ?? []).join(', '));
    setMaxPrep(current.maxPrepMinutes ?? 60);
    setCountryCode(current.countryCode ?? deviceCountry());
  }, [current]);

  const save = () => {
    const weightKg = parseRequiredNumber(weight, 20, 500);
    const heightCm = parseRequiredNumber(height, 80, 260);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
      Number.isNaN(new Date(`${dateOfBirth}T12:00:00`).getTime())
    ) {
      Alert.alert('Check your birth date', 'Use YYYY-MM-DD, for example 1994-05-20.');
      return;
    }
    if (!weightKg.valid || !heightCm.valid) {
      Alert.alert(
        'Check your measurements',
        'Enter a weight from 20-500 kg and a height from 80-260 cm.',
      );
      return;
    }
    const maxPrepMinutes = maxPrep;
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
      dietaryPreferences: diet,
      foodAllergies: allergies,
      dislikedIngredients: csv(dislikes),
      maxPrepMinutes,
      countryCode,
    });
    router.back();
  };

  return (
    <MealScreen
      title="Nutrition profile"
      subtitle="Your targets change when you do"
      action={
        <Pressable onPress={save} style={styles.save}>
          <Text style={[type.labelSm, { color: palette.onPrimary }]}>Save</Text>
        </Pressable>
      }
    >
      <View style={styles.intro}>
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
          Your current weight updates future targets and is added to your private measurement
          history. Previous daily targets stay unchanged.
        </Text>
      </View>

      <DateField
        label="Date of birth"
        value={dateOfBirth}
        onChange={setDateOfBirth}
        maximumDate={new Date()}
      />
      <View style={styles.measurementFields}>
        <NumberField
          label="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          min={20}
          max={500}
          step={0.5}
          placeholder="66"
        />
        <NumberField
          label="Height (cm)"
          value={height}
          onChangeText={setHeight}
          min={80}
          max={260}
          step={1}
          placeholder="168"
        />
      </View>
      <ChoiceGroup label="Biological sex" value={sex} options={sexOptions} onChange={setSex} />
      <ChoiceGroup
        label="Activity"
        value={activity}
        options={activityOptions}
        onChange={setActivity}
      />
      <ChoiceGroup label="Goal" value={goal} options={goalOptions} onChange={setGoal} />
      <ChoiceGroup
        label="Food region"
        value={countryCode}
        options={countryOptions}
        onChange={setCountryCode}
      />
      <MultiChoiceField
        label="Dietary preferences"
        value={diet}
        suggestions={dietChoices}
        onChange={setDiet}
        allowCustom
        customPlaceholder="Add dietary preference"
      />
      <MultiChoiceField
        label="Allergies"
        value={allergies}
        suggestions={allergyChoices}
        onChange={setAllergies}
        allowCustom
        customPlaceholder="Add allergy"
      />
      <AutocompleteField
        label="Ingredients to avoid"
        value={dislikes}
        onChangeText={setDislikes}
        suggestions={ingredientSuggestions}
        placeholder="mushroom, coriander"
      />
      <ChoiceGroup
        label="Maximum prep time (minutes)"
        value={maxPrep}
        options={prepTimeOptions}
        onChange={setMaxPrep}
      />

      {user?.measurements.length ? (
        <View style={styles.history}>
          <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Recent updates</Text>
          {user.measurements
            .slice(-3)
            .reverse()
            .map((measurement) => (
              <View key={measurement.id} style={styles.historyRow}>
                <Text style={[type.bodyMd, { color: palette.onSurface }]}>
                  {measurement.weightKg} kg
                </Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>
                  {new Date(measurement.measuredAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
        </View>
      ) : null}
    </MealScreen>
  );
}

function csv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function deviceCountry() {
  return Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1]?.toUpperCase() ?? 'ZA';
}

const styles = StyleSheet.create({
  save: {
    height: 38,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    borderRadius: radii.sm,
  },
  intro: {
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  measurementFields: { gap: spacing.md },
  history: {
    gap: spacing.sm,
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
