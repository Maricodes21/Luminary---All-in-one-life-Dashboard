import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { DateField } from '@/components/ui/DateField';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { habitCategories } from '@/lib/modulePresets';
import { localDateKey, nextLocalDate } from '@/lib/habits';
import { useProductionStore, type HabitSchedule } from '@/stores/useProductionStore';

const dayChoices = [
  { value: 1, label: 'M' }, { value: 2, label: 'T' }, { value: 3, label: 'W' },
  { value: 4, label: 'T' }, { value: 5, label: 'F' }, { value: 6, label: 'S' }, { value: 0, label: 'S' },
] as const;
const timeChoices = [
  { value: 'morning', label: 'Morning' }, { value: 'day', label: 'Day' },
  { value: 'evening', label: 'Evening' }, { value: 'anytime', label: 'Anytime' },
] as const;

export default function NewCommitment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { replaceId, effectiveDate } = useLocalSearchParams<{ replaceId?: string; effectiveDate?: string }>();
  const existing = useProductionStore((state) => state.habits.find((habit) => habit.id === replaceId));
  const addHabit = useProductionStore((state) => state.addHabit);
  const substituteHabit = useProductionStore((state) => state.substituteHabit);
  const today = useMemo(() => localDateKey(new Date()), []);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(existing?.category ?? 'Mind');
  const [timeWindow, setTimeWindow] = useState<HabitSchedule['timeWindow']>(existing?.schedule?.timeWindow ?? 'anytime');
  const [days, setDays] = useState<number[]>(existing?.schedule?.days ?? [1, 2, 3, 4, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState(existing?.schedule?.weeklyTarget ?? 5);
  const [activeFrom, setActiveFrom] = useState(effectiveDate ?? (existing ? nextLocalDate(today) : today));
  const [error, setError] = useState('');

  function toggleDay(day: number) {
    setDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day]);
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Give this commitment a name.'); return; }
    if (!days.length) { setError('Choose at least one day.'); return; }
    const schedule = { days, timeWindow, weeklyTarget: Math.min(weeklyTarget, days.length) };
    if (existing) substituteHabit(existing.id, activeFrom, { name: trimmed, category, schedule });
    else addHabit(trimmed, { category, schedule, activeFrom });
    router.replace('/habits');
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Back"><Icon name="back" /></Pressable>
          <SectionLabel>{existing ? 'Substitute commitment' : 'New commitment'}</SectionLabel>
          <View style={styles.topbarSpacer} />
        </View>

        <View style={styles.intro}><Text style={[type.displaySm, styles.title]}>{existing ? 'Make room for what fits next.' : 'Shape it around your real week.'}</Text><Text style={[type.bodyMd, styles.muted]}>{existing ? `${existing.name} keeps its earlier history. The new commitment begins on the date below.` : 'A clear rhythm is easier to return to than a perfect streak.'}</Text></View>

        <View style={styles.formCard}>
          <View style={styles.field}><Text style={[type.labelSm, styles.muted]}>Name</Text><TextInput autoFocus value={name} onChangeText={(value) => { setName(value); setError(''); }} placeholder="e.g. Pack lunch before bed" placeholderTextColor={palette.onSurfaceVariant} style={[type.bodyMd, styles.input]} returnKeyType="next" accessibilityLabel="Commitment name" /></View>
          <View style={styles.field}><Text style={[type.labelSm, styles.muted]}>Category</Text><View style={styles.wrap}>{habitCategories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipSelected]} accessibilityRole="radio" accessibilityState={{ selected: category === item }}><Text style={[type.bodySm, category === item ? styles.chipTextSelected : styles.muted]}>{item}</Text></Pressable>)}</View></View>
          <ChoiceGroup label="Place in your day" value={timeWindow} options={timeChoices} onChange={setTimeWindow} />
          <View style={styles.field}><Text style={[type.labelSm, styles.muted]}>Scheduled days</Text><View style={styles.dayRow}>{dayChoices.map((day, index) => { const selected = days.includes(day.value); return <Pressable key={`${day.value}-${index}`} onPress={() => toggleDay(day.value)} style={[styles.dayChip, selected && styles.dayChipSelected]} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={`Schedule ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day.value]}`}><Text style={[type.labelMd, selected ? styles.chipTextSelected : styles.muted]}>{day.label}</Text></Pressable>; })}</View></View>
          <ChoiceGroup label="Weekly rhythm" value={weeklyTarget} options={[1, 2, 3, 4, 5, 6, 7].filter((value) => value <= Math.max(1, days.length)).map((value) => ({ value, label: `${value}×` }))} onChange={setWeeklyTarget} />
          <DateField label={existing ? 'Substitute from' : 'Start date'} value={activeFrom} onChange={setActiveFrom} minimumDate={new Date()} />
        </View>

        {error ? <Text style={[type.bodySm, styles.error]} accessibilityRole="alert">{error}</Text> : null}
        <Pressable onPress={save} style={styles.saveButton} accessibilityRole="button"><Text style={[type.labelMd, styles.saveText]}>{existing ? 'Use this substitute' : 'Add commitment'}</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface }, content: { paddingHorizontal: spacing.md, gap: spacing.lg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topbarSpacer: { width: 44 },
  iconButton: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerHigh },
  intro: { gap: spacing.sm }, title: { color: palette.onSurface }, muted: { color: palette.onSurfaceVariant },
  formCard: { padding: spacing.md, gap: spacing.lg, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerLow }, field: { gap: spacing.sm },
  input: { minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radii.md, color: palette.onSurface, backgroundColor: palette.surfaceContainerHigh },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: palette.surfaceContainerHigh }, chipSelected: { backgroundColor: palette.primary }, chipTextSelected: { color: palette.onPrimary },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs }, dayChip: { flex: 1, minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh }, dayChipSelected: { backgroundColor: palette.primary },
  error: { color: palette.error }, saveButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.primary }, saveText: { color: palette.onPrimary },
});
