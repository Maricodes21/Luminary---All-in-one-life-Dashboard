import { useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { toLocalDateValue } from '@/lib/forms/assistedInputs';
import { Icon } from './Icon';

export type DateFieldProps = { label: string; value: string; onChange: (value: string) => void; maximumDate?: Date; minimumDate?: Date };

function fromLocalDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}

export function DateField({ label, value, onChange, maximumDate, minimumDate }: DateFieldProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const onPickerChange = (_event: DateTimePickerEvent, date?: Date) => {
    setPickerVisible(false);
    if (date) onChange(toLocalDateValue(date));
  };

  return (
    <View style={styles.root}>
      <Text style={[type.labelSm, styles.label]}>{label}</Text>
      <Pressable
        onPress={() => setPickerVisible(true)}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'Select date'}`}
      >
        <Text style={[type.bodyMd, styles.value]}>{value || 'Select date'}</Text>
        <Icon name="calendar" size={19} color={palette.onSurfaceVariant} />
      </Pressable>
      {pickerVisible ? (
        <DateTimePicker
          value={fromLocalDateValue(value)}
          mode="date"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={onPickerChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: { color: palette.onSurfaceVariant },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceContainerLow,
  },
  value: { color: palette.onSurface },
});
