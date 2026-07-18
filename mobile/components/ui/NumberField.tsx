import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { clampNumber, stepNumber } from '@/lib/forms/assistedInputs';
import { Icon } from './Icon';

export type NumberFieldProps = { label: string; value: string; onChangeText: (value: string) => void; unit?: string; min?: number; max?: number; step?: number; showStepper?: boolean; placeholder?: string };

export function NumberField({ label, value, onChangeText, unit, min, max, step = 1, showStepper = true, placeholder }: NumberFieldProps) {
  const lowerBound = min ?? -Number.MAX_SAFE_INTEGER;
  const upperBound = max ?? Number.MAX_SAFE_INTEGER;
  const parsedValue = Number(value);
  const currentValue = Number.isFinite(parsedValue) ? parsedValue : (min ?? 0);

  const adjust = (direction: -1 | 1) => onChangeText(String(stepNumber(currentValue, step, direction, lowerBound, upperBound)));
  const commitValue = () => {
    const trimmedValue = value.trim();
    const nextValue = Number(trimmedValue);
    if (trimmedValue && Number.isFinite(nextValue)) onChangeText(String(clampNumber(nextValue, lowerBound, upperBound)));
  };

  return (
    <View style={styles.root}>
      <Text style={[type.labelSm, styles.label]}>{label}</Text>
      <View style={styles.row}>
        {showStepper ? (
          <Pressable onPress={() => adjust(-1)} style={styles.stepButton} accessibilityRole="button" accessibilityLabel={`Decrease ${label}`}>
            <Text style={[type.titleMd, styles.stepSymbol]}>-</Text>
          </Pressable>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.onSurfaceVariant}
          keyboardType="decimal-pad"
          onBlur={commitValue}
          onSubmitEditing={commitValue}
          style={[type.bodyMd, styles.input]}
          accessibilityLabel={label}
        />
        {unit ? <Text style={[type.bodySm, styles.unit]}>{unit}</Text> : null}
        {showStepper ? (
          <Pressable onPress={() => adjust(1)} style={styles.stepButton} accessibilityRole="button" accessibilityLabel={`Increase ${label}`}>
            <Icon name="plus" size={18} color={palette.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: { color: palette.onSurfaceVariant },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, minHeight: 48, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: palette.outlineVariant, borderRadius: radii.sm, color: palette.onSurface, backgroundColor: palette.surfaceContainerLow },
  unit: { color: palette.onSurfaceVariant, minWidth: 28 },
  stepButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, backgroundColor: palette.surfaceContainerHigh },
  stepSymbol: { color: palette.primary, lineHeight: 22 },
});
