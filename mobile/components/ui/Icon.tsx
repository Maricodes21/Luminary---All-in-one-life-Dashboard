import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { palette } from '@luminary/design-system';

/**
 * Icon abstraction — wrapper over react-native-svg paths.
 *
 * We use bespoke SVG paths so we control stroke/fill weight per the design
 * system's "tactile feel" rule. Swap in @expo/vector-icons later if we want a
 * wider catalog, but the primitive stays.
 *
 * Naming follows semantic intent (home, journal, health, money, lock, sparkles, close)
 * rather than visual shape. Component is named `Icon`, not `Symbol`, because
 * `Symbol` is a built-in JS global and shadowing it bites you eventually.
 */

type IconName = 'home' | 'journal' | 'health' | 'money' | 'lock' | 'sparkles' | 'close';

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
};

// Minimal icon paths. Will graduate to a curated set in Phase 5.
const paths: Record<IconName, () => React.ReactNode> = {
  home: () => (
    <Path
      d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  journal: () => (
    <Path
      d="M5 4a2 2 0 0 1 2-2h11v20H7a2 2 0 0 1-2-2V4zM9 6h7M9 10h7M9 14h5"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
    />
  ),
  health: () => (
    <Path
      d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  money: () => (
    <Path
      d="M3 7h18v10H3zM3 11h18M7 15h2"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  lock: () => (
    <Path
      d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  sparkles: () => (
    <Path
      d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3zM18 14l.9 2.3L21 17l-2.1.7L18 20l-.9-2.3L15 17l2.1-.7L18 14z"
      stroke="currentColor"
      strokeWidth={1.6}
      fill="currentColor"
      strokeLinejoin="round"
    />
  ),
  close: () => (
    <Path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
    />
  ),
};

export function Icon({ name, size = 22, color = palette.onSurface }: IconProps) {
  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" color={color}>
        {paths[name]()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
});
