import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette, type } from '@luminary/design-system';

const SIZE = 132;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ consumed, target }: { consumed: number; target: number | null }) {
  const remainder = target == null ? null : target - consumed;
  const progress = target && target > 0 ? Math.min(1, consumed / target) : 0;
  const exceeded = remainder != null && remainder < 0;

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: target ?? 0, now: consumed }}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={palette.surfaceContainerHighest} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={exceeded ? palette.error : palette.primary}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.copy}>
        <Text style={[type.displaySm, { color: exceeded ? palette.error : palette.onSurface }]} numberOfLines={1} adjustsFontSizeToFit>
          {remainder == null ? '--' : Math.abs(Math.round(remainder))}
        </Text>
        <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
          {remainder == null ? 'set target' : exceeded ? 'cal over' : 'cal left'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  copy: { width: 86, alignItems: 'center', justifyContent: 'center' },
});
