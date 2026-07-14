import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';

export type MealsMode = 'today' | 'plan';

export function MealsSegmentedControl({ value, onChange }: { value: MealsMode; onChange: (mode: MealsMode) => void }) {
  return (
    <View style={styles.root} accessibilityRole="tablist">
      {(['today', 'plan'] as const).map((mode) => {
        const active = mode === value;
        return (
          <Pressable key={mode} onPress={() => onChange(mode)} style={[styles.item, active && styles.active]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={[type.labelMd, { color: active ? palette.onPrimary : palette.onSurfaceVariant }]}>{mode}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: 40, flexDirection: 'row', backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.xs, gap: spacing.xs },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  active: { backgroundColor: palette.primary },
});
