import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { palette, radii, type } from '@luminary/design-system';

type MacroProgressProps = {
  label: string;
  value: number;
  target: number | null;
  color: string;
};

export function MacroProgress({ label, value, target, color }: MacroProgressProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progress = target && target > 0 ? Math.min(1, value / target) : 0;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      if (reduceMotion) {
        animatedValue.setValue(progress);
        return;
      }
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 450,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      active = false;
      animatedValue.stopAnimation();
    };
  }, [animatedValue, progress]);

  const width = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: target ?? 0, now: Math.round(value) }}
    >
      <View style={styles.copy}>
        <Text style={[type.labelSm, styles.label]}>{label}</Text>
        <Text style={[type.labelSm, styles.value]}>{Math.round(value)}{target == null ? 'g' : ` / ${target}g`}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: color, width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 5 },
  copy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { color: palette.onSurfaceVariant },
  value: { color: palette.onSurface },
  track: { height: 6, overflow: 'hidden', borderRadius: radii.pill, backgroundColor: palette.surfaceContainerHighest },
  fill: { height: 6, borderRadius: radii.pill },
});
