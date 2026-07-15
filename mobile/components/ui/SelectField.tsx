import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { ActionSheet } from './ActionSheet';
import { Icon } from './Icon';

export type SelectFieldProps = { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; allowCustom?: boolean };

export function SelectField({ label, value, options, onChange, allowCustom = false }: SelectFieldProps) {
  const [visible, setVisible] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const select = (nextValue: string) => {
    onChange(nextValue);
    setVisible(false);
  };

  const addCustom = () => {
    const nextValue = customValue.trim();
    if (nextValue) select(nextValue);
  };

  return (
    <View style={styles.root}>
      <Text style={[type.labelSm, styles.label]}>{label}</Text>
      <Pressable onPress={() => setVisible(true)} style={styles.field} accessibilityRole="button" accessibilityLabel={`${label}: ${value || 'Select'}`}>
        <Text style={[type.bodyMd, styles.value]}>{value || 'Select'}</Text>
        <Icon name="back" size={18} color={palette.onSurfaceVariant} />
      </Pressable>
      <ActionSheet visible={visible} title={label} onClose={() => setVisible(false)}>
        <View style={styles.options} accessibilityRole="menu" accessibilityLabel={label}>
          {options.map((option) => {
            const selected = option === value;
            return (
              <Pressable
                key={option}
                onPress={() => select(option)}
                style={[styles.option, selected && styles.optionSelected]}
                accessibilityRole="menuitem"
                accessibilityLabel={option}
                accessibilityState={{ selected }}
              >
                <Text style={[type.bodyMd, { color: selected ? palette.primary : palette.onSurface }]}>{option}</Text>
                {selected ? <Icon name="check" size={18} color={palette.primary} /> : null}
              </Pressable>
            );
          })}
          {allowCustom ? (
            <View style={styles.customRow}>
              <TextInput
                value={customValue}
                onChangeText={setCustomValue}
                onSubmitEditing={addCustom}
                placeholder="Add another"
                placeholderTextColor={palette.onSurfaceVariant}
                style={[type.bodyMd, styles.customInput]}
                accessibilityLabel={`Custom ${label}`}
              />
              <Pressable onPress={addCustom} style={styles.addButton} accessibilityRole="button" accessibilityLabel={`Add custom ${label}`}>
                <Text style={[type.labelSm, { color: palette.onPrimary }]}>Add</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ActionSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: { color: palette.onSurfaceVariant },
  field: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: palette.outlineVariant, borderRadius: radii.sm, backgroundColor: palette.surfaceContainerLow },
  value: { color: palette.onSurface },
  options: { gap: spacing.sm },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, borderRadius: radii.sm, backgroundColor: palette.surfaceContainerHigh },
  optionSelected: { backgroundColor: `${palette.primary}14` },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  customInput: { flex: 1, minHeight: 44, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: palette.outlineVariant, borderRadius: radii.sm, color: palette.onSurface },
  addButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.sm, backgroundColor: palette.primary },
});
