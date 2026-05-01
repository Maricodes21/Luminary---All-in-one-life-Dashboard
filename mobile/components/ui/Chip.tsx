import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { palette, radii, spacing, type, ghostBorder } from '@luminary/design-system';

export type ChipProps = {
  label: string;
  selected?: boolean;
  accent?: string; // tint when selected; defaults to primary.
  onPress?: () => void;
  style?: ViewStyle;
};

/**
 * Chip — mood/action selectable.
 *
 * Default: surface-container-high background with a ghost border (no 1px line — uses 15% opacity outline-variant).
 * Selected: tint @ 18% bg, accent text + accent border.
 */
export function Chip({ label, selected = false, accent = palette.primary, onPress, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? `${accent}30` : palette.surfaceContainerHigh,
          borderColor: selected ? `${accent}80` : ghostBorder(0.15),
        },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={[type.bodySm, { color: selected ? accent : palette.onSurface, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1, // ghost border only — color comes from ghostBorder() at 15% opacity per design system.
  },
});
