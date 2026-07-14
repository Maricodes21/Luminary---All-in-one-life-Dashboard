import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealScreen } from '@/components/meals/MealScreen';
import { recipeCatalog } from '@/lib/meals/catalog';
import { localDateKey } from '@/lib/meals/dates';
import { buildCatalogPlan } from '@/lib/meals/recommendations';
import type { MealType } from '@/lib/meals/types';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';

const planMealTypes = ['breakfast', 'lunch', 'dinner'] as const;

export default function PlanBuilderScreen() {
  const router = useRouter();
  const user = useMealsStore(activeMealsUser);
  const ensureTarget = useMealsStore((state) => state.ensureTarget);
  const replacePlans = useMealsStore((state) => state.replacePlans);
  const [days, setDays] = useState<5 | 7>(7);
  const [mealTypes, setMealTypes] = useState<MealType[]>(['breakfast', 'lunch', 'dinner']);
  const [includeSnack, setIncludeSnack] = useState(false);
  const [highProtein, setHighProtein] = useState(false);
  const today = localDateKey(new Date());
  const target = user?.targets[today];

  useEffect(() => { ensureTarget(); }, [ensureTarget]);

  const toggleMeal = (mealType: MealType) => setMealTypes((current) => current.includes(mealType) ? current.filter((item) => item !== mealType) : [...current, mealType]);
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
    const plan = buildCatalogPlan({ recipes: recipeCatalog, profile: user.profile, target, weekOf: today, options: { days, mealTypes, includeSnack, highProtein } });
    if (!plan.entries.length) {
      Alert.alert('No safe catalog match', 'Your current restrictions do not match a validated recipe yet. Adjust the preferences or use search and Manual entry.');
      return;
    }
    replacePlans([plan]);
    router.replace({ pathname: '/(tabs)/meals', params: { mode: 'plan' } });
  };

  return (
    <MealScreen title="Build your week" subtitle="Catalog first, flexible by design">
      <ChoiceGroup label="Plan length" values={[5, 7] as const} value={days} onChange={setDays} format={(value) => `${value} days`} />
      <View style={styles.group}>
        <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Meals to plan</Text>
        <View style={styles.row}>{planMealTypes.map((mealType) => <Toggle key={mealType} label={mealType} selected={mealTypes.includes(mealType)} onPress={() => toggleMeal(mealType)} />)}</View>
      </View>
      <Setting label="Add a snack when it fits" detail="Snacks are skipped if they would exceed the daily target." selected={includeSnack} onPress={() => setIncludeSnack((value) => !value)} />
      <Setting label="Prioritize protein" detail="Still respects your calorie target, restrictions, and prep limit." selected={highProtein} onPress={() => setHighProtein((value) => !value)} />
      <View style={styles.profileSummary}>
        <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Plan basis</Text>
        <Text style={[type.bodyMd, { color: palette.onSurface, marginTop: spacing.xs }]}>{user?.profile ? `${user.profile.goal} / ${target?.calories ?? '--'} calories / max ${user.profile.maxPrepMinutes ?? 60} min prep` : 'Nutrition profile not set'}</Text>
        <Pressable onPress={() => router.push('/meals/profile')} style={styles.editProfile}><Text style={[type.labelSm, { color: palette.primary }]}>Edit preferences</Text></Pressable>
      </View>
      <Pressable onPress={generate} style={styles.generate}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Generate plan</Text></Pressable>
    </MealScreen>
  );
}

function ChoiceGroup<T extends number>({ label, values, value, onChange, format }: { label: string; values: readonly T[]; value: T; onChange: (value: T) => void; format: (value: T) => string }) {
  return <View style={styles.group}><Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>{label}</Text><View style={styles.row}>{values.map((item) => <Toggle key={item} label={format(item)} selected={item === value} onPress={() => onChange(item)} />)}</View></View>;
}

function Toggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.toggle, selected && styles.selected]} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}><Text style={[type.labelSm, { color: selected ? palette.onPrimary : palette.onSurfaceVariant }]}>{label}</Text></Pressable>;
}

function Setting({ label, detail, selected, onPress }: { label: string; detail: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.setting} accessibilityRole="switch" accessibilityState={{ checked: selected }}><View style={{ flex: 1 }}><Text style={[type.titleMd, { color: palette.onSurface }]}>{label}</Text><Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>{detail}</Text></View><View style={[styles.switch, selected && styles.switchOn]}><View style={[styles.knob, selected && styles.knobOn]} /></View></Pressable>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
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
