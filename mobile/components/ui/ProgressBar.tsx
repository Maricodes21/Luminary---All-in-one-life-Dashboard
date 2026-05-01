import { View, StyleSheet, ViewStyle } from 'react-native';
import { palette, radii } from '@luminary/design-system';

export type ProgressBarProps = {
  value: number; // 0..max
  max: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({ value, max, color = palette.primary, height = 6, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View
      style={[
        {
          width: '100%',
          height,
          backgroundColor: palette.surfaceContainerHigh,
          borderRadius: radii.pill,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: radii.pill }} />
    </View>
  );
}
