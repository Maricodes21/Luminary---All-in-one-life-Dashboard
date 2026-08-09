import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';

export type ChoiceOption<T extends string | number> = { value: T; label: string };
export type ChoiceGroupProps<T extends string | number> = { label: string; value: T; options: readonly ChoiceOption<T>[]; onChange: (value: T) => void };

export function ChoiceGroup<T extends string | number>({ label, value, options, onChange }: ChoiceGroupProps<T>) {
  return (
    <View style={styles.root} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={[type.labelSm, styles.label]}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={[styles.option, selected && styles.optionSelected]}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
            >
              <Text style={[type.bodySm, { color: selected ? palette.onPrimary : palette.onSurfaceVariant }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: { color: palette.onSurfaceVariant },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    backgroundColor: palette.surfaceContainerLow,
  },
  optionSelected: { borderColor: palette.primary, backgroundColor: palette.primary },
});
