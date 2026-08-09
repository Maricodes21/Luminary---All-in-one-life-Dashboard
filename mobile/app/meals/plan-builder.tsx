import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealScreen } from '@/components/meals/MealScreen';
import { recipeCatalog, type PreparationMethod } from '@/lib/meals/catalog';
import { localDateKey } from '@/lib/meals/dates';
import { buildCatalogPlan, type PreparationBalance } from '@/lib/meals/recommendations';
import type { MealType } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

const planMealTypes = ['breakfast', 'lunch', 'dinner'] as const;
const preparationChoices: { value: PreparationMethod; label: string }[] = [
  { value: 'air-fryer', label: 'Air fryer' },
  { value: 'one-pan', label: 'One pan' },
  { value: 'stovetop', label: 'Stovetop' },
  { value: 'oven', label: 'Oven' },
  { value: 'no-cook', label: 'No cook' },
  { value: 'slow-cooker', label: 'Slow cooker' },
];

export default function PlanBuilderScreen() {
  const router = useRouter();
  const user = useMealsStore(activeMealsUser);
  const ensureTarget = useMealsStore((state) => state.ensureTarget);
  const replacePlans = useMealsStore((state) => state.replacePlans);
  const [days, setDays] = useState<5 | 7>(7);
  const [mealTypes, setMealTypes] = useState<MealType[]>(['breakfast', 'lunch', 'dinner']);
  const [includeSnack, setIncludeSnack] = useState(false);
  const [highProtein, setHighProtein] = useState(false);
  const [preparationMethods, setPreparationMethods] = useState<PreparationMethod[]>([]);
  const [preparationBalance, setPreparationBalance] = useState<PreparationBalance>('spread');
  const today = localDateKey(new Date());
  const target = user?.targets[today];

  useEffect(() => { ensureTarget(); }, [ensureTarget]);

  const toggleMeal = (mealType: MealType) => setMealTypes((current) => current.includes(mealType) ? current.filter((item) => item !== mealType) : [...current, mealType]);
  const toggleMethod = (method: PreparationMethod) => setPreparationMethods((current) => current.includes(method) ? current.filter((item) => item !== method) : [...current, method]);
  const generate = () => {
    if (!user?.profile) {
      Alert.alert('Set your nutrition profile first', 'Your weight, goal, timing, allergies, and food preferences shape the plan.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Set profile', onPress: () => router.push('/meals/profile') },
      ]);
      return;
    }
    if (!target || !mealTypes.length) {
      Alert.alert('Choose at least one meal', 'Select the meal times you want Luminary to plan.');
      return;
    }
    const plan = buildCatalogPlan({
      recipes: recipeCatalog,
      profile: user.profile,
      target,
      weekOf: today,
      options: {
        days,
        mealTypes,
        includeSnack,
        highProtein,
        preparationMethods,
        preparationBalance,
      },
      history: user.planHistory ?? [],
    });
    if (!plan.entries.length) {
      Alert.alert('No recipes fit yet', 'Try another cooking style or update your food preferences. You can still add meals from search.');
      return;
    }
    replacePlans([plan]);
    router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } });
  };

  return (
    <MealScreen title="Build your week" subtitle="Choose what fits your kitchen">
      <ChoiceGroup label="Plan length" values={[5, 7] as const} value={days} onChange={setDays} format={(value) => `${value} days`} />
      <View style={styles.group}>
        <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Meals to plan</Text>
        <View style={styles.row}>{planMealTypes.map((mealType) => <Toggle key={mealType} label={mealType} selected={mealTypes.includes(mealType)} onPress={() => toggleMeal(mealType)} />)}</View>
      </View>
      <Setting label="Add a snack when it fits" detail="Snacks are skipped if they would exceed the daily target." selected={includeSnack} onPress={() => setIncludeSnack((value) => !value)} />
      <View style={styles.group}>
        <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>How do you want to cook?</Text>
        <View style={styles.methodRow}>
          <MethodToggle label="Mix it up" selected={!preparationMethods.length} onPress={() => setPreparationMethods([])} />
          {preparationChoices.map((choice) => (
            <MethodToggle
              key={choice.value}
              label={choice.label}
              selected={preparationMethods.includes(choice.value)}
              onPress={() => toggleMethod(choice.value)}
            />
          ))}
        </View>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>Choose one or combine a few. We will rotate them through the week instead of using them all on the first day.</Text>
      </View>
      {preparationMethods.length ? (
        <View style={styles.group}>
          <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>How often?</Text>
          <View style={styles.row}>
            <Toggle label="Once most days" selected={preparationBalance === 'spread'} onPress={() => setPreparationBalance('spread')} />
            <Toggle label="Most meals" selected={preparationBalance === 'mostly'} onPress={() => setPreparationBalance('mostly')} />
          </View>
        </View>
      ) : null}
      <Setting label="More protein" detail="Use higher-protein recipes that still fit your daily target." selected={highProtein} onPress={() => setHighProtein((value) => !value)} />
      <View style={styles.profileSummary}>
        <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Your settings</Text>
        <Text style={[type.bodyMd, { color: palette.onSurface, marginTop: spacing.xs }]}>{user?.profile ? `${user.profile.goal} goal / ${target?.calories ?? '--'} calories / up to ${user.profile.maxPrepMinutes ?? 60} min` : 'Add your food preferences first'}</Text>
        <Pressable onPress={() => router.push('/meals/profile')} style={styles.editProfile}><Text style={[type.labelSm, { color: palette.primary }]}>Edit preferences</Text></Pressable>
      </View>
      <Pressable onPress={generate} style={styles.generate}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Build my plan</Text></Pressable>
    </MealScreen>
  );
}

function ChoiceGroup<T extends number>({ label, values, value, onChange, format }: { label: string; values: readonly T[]; value: T; onChange: (value: T) => void; format: (value: T) => string }) {
  return <View style={styles.group}><Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>{label}</Text><View style={styles.row}>{values.map((item) => <Toggle key={item} label={format(item)} selected={item === value} onPress={() => onChange(item)} />)}</View></View>;
}

function Toggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.toggle, selected && styles.selected]} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}><Text style={[type.labelSm, { color: selected ? palette.onPrimary : palette.onSurfaceVariant }]}>{label}</Text></Pressable>;
}

function MethodToggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.methodToggle, selected && styles.selected]} accessibilityRole="radio" accessibilityState={{ selected }}><Text style={[type.labelSm, { color: selected ? palette.onPrimary : palette.onSurfaceVariant }]}>{label}</Text></Pressable>;
}

function Setting({ label, detail, selected, onPress }: { label: string; detail: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.setting} accessibilityRole="switch" accessibilityState={{ checked: selected }}><View style={{ flex: 1 }}><Text style={[type.titleMd, { color: palette.onSurface }]}>{label}</Text><Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>{detail}</Text></View><View style={[styles.switch, selected && styles.switchOn]}><View style={[styles.knob, selected && styles.knobOn]} /></View></Pressable>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  methodToggle: { width: '48%', minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm },
  toggle: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainer, borderRadius: radii.sm },
  selected: { backgroundColor: palette.primary },
  setting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm, padding: spacing.md },
  switch: { width: 46, height: 26, borderRadius: 13, backgroundColor: palette.surfaceContainerHighest, padding: 3 },
  switchOn: { backgroundColor: palette.primary },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: palette.onSurfaceVariant },
  knobOn: { alignSelf: 'flex-end', backgroundColor: palette.onPrimary },
  profileSummary: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  editProfile: { minHeight: 38, alignSelf: 'flex-start', justifyContent: 'center', marginTop: spacing.xs },
  generate: { minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm },
});
