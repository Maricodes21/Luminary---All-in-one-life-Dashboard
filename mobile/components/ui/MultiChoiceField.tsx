import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { uniqueChoices } from '@/lib/forms/assistedInputs';
import { Chip } from './Chip';

export type MultiChoiceFieldProps = { label: string; value: string[]; suggestions: readonly string[]; onChange: (value: string[]) => void; allowCustom?: boolean; customPlaceholder?: string };

export function MultiChoiceField({ label, value, suggestions, onChange, allowCustom = false, customPlaceholder = 'Add another' }: MultiChoiceFieldProps) {
  const [customValue, setCustomValue] = useState('');
  const choices = uniqueChoices([...suggestions, ...value]);

  const toggle = (choice: string) => {
    const selected = value.some((item) => item.toLowerCase() === choice.toLowerCase());
    onChange(selected ? value.filter((item) => item.toLowerCase() !== choice.toLowerCase()) : [...value, choice]);
  };

  const addCustom = () => {
    const choice = customValue.trim();
    if (choice && !value.some((item) => item.toLowerCase() === choice.toLowerCase())) onChange([...value, choice]);
    setCustomValue('');
  };

  return (
    <View style={styles.root} accessibilityLabel={label}>
      <Text style={[type.labelSm, styles.label]}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.choices}
        contentContainerStyle={styles.choiceContent}
        accessibilityRole="list"
        accessibilityLabel={`${label} choices`}
      >
        {choices.map((choice) => {
          const selected = value.some((item) => item.toLowerCase() === choice.toLowerCase());
          return <Chip key={choice.toLowerCase()} label={choice} selected={selected} onPress={() => toggle(choice)} />;
        })}
      </ScrollView>
      {allowCustom ? (
        <View style={styles.customRow}>
          <TextInput
            value={customValue}
            onChangeText={setCustomValue}
            onSubmitEditing={addCustom}
            placeholder={customPlaceholder}
            placeholderTextColor={palette.onSurfaceVariant}
            style={[type.bodySm, styles.customInput]}
            accessibilityLabel={`${label}: ${customPlaceholder}`}
            returnKeyType="done"
          />
          <Pressable onPress={addCustom} style={styles.addButton} accessibilityRole="button" accessibilityLabel={`Add ${label}`}>
            <Text style={[type.labelSm, { color: palette.onPrimary }]}>Add</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: { color: palette.onSurfaceVariant },
  choices: { height: 44 },
  choiceContent: { alignItems: 'center', gap: spacing.sm, paddingRight: spacing.xs },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  customInput: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radii.sm,
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerLow,
  },
  addButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.sm, backgroundColor: palette.primary },
});
