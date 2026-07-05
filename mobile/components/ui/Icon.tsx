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
 * Naming follows semantic intent (home, journal, meals, health, money, lock, sparkles, close)
 * rather than visual shape. Component is named `Icon`, not `Symbol`, because
 * `Symbol` is a built-in JS global and shadowing it bites you eventually.
 */

export type IconName =
  | 'home'
  | 'journal'
  | 'meals'
  | 'health'
  | 'money'
  | 'lock'
  | 'sparkles'
  | 'close'
  | 'settings'
  | 'plus'
  | 'search'
  | 'camera'
  | 'barcode'
  | 'calendar'
  | 'check'
  | 'clock'
  | 'profile'
  | 'swap'
  | 'receipt'
  | 'trend'
  | 'water'
  | 'book'
  | 'trash';

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
  meals: () => (
    <Path
      d="M7 3v8M11 3v8M7 7h4M9 11v10M17 3v18M15 3c3 2.5 3 6.5 0 9"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
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
  settings: () => (
    <Path
      d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM4 13l-1-1 2-3 1.5.5a7 7 0 0 1 1.2-.7L8 6h4l.3 2.3c.4.2.8.4 1.2.7L15 8.5l2 3-1 1v1l1 1-2 3-1.5-.5c-.4.3-.8.5-1.2.7L12 20H8l-.3-2.3c-.4-.2-.8-.4-1.2-.7L5 17.5l-2-3 1-1v-1z"
      stroke="currentColor"
      strokeWidth={1.8}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  plus: () => (
    <Path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.2} fill="none" strokeLinecap="round" />
  ),
  search: () => (
    <Path
      d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
    />
  ),
  camera: () => (
    <Path
      d="M4 8h3l1.5-2h7L17 8h3v11H4V8zM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  barcode: () => (
    <Path
      d="M5 5v14M8 5v14M12 5v14M16 5v14M19 5v14"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
    />
  ),
  calendar: () => (
    <Path
      d="M5 5h14v15H5zM8 3v4M16 3v4M5 10h14"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  check: () => (
    <Path d="M5 12.5l4.2 4L19 7" stroke="currentColor" strokeWidth={2.2} fill="none" strokeLinecap="round" />
  ),
  clock: () => (
    <Path
      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
    />
  ),
  profile: () => (
    <Path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
    />
  ),
  swap: () => (
    <Path
      d="M7 7h11l-3-3M17 17H6l3 3"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  receipt: () => (
    <Path
      d="M7 3h10v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V3zM9 8h6M9 12h6M9 16h4"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  trend: () => (
    <Path
      d="M4 17l5-5 4 3 7-8M16 7h4v4"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  water: () => (
    <Path
      d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11zM9 15a3 3 0 0 0 3 3"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  book: () => (
    <Path
      d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5zM5 5.5V21M9 7h7M9 11h6"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  trash: () => (
    <Path
      d="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M7 7l1 14h8l1-14"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
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
