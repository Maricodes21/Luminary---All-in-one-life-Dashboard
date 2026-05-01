import { View, ViewProps, StyleSheet } from 'react-native';
import { palette, radii, spacing } from '@luminary/design-system';

type CardVariant = 'default' | 'recessed' | 'featured';

export type CardProps = ViewProps & {
  variant?: CardVariant;
  padding?: keyof typeof spacing;
  radius?: keyof typeof radii;
};

const variantBg: Record<CardVariant, string> = {
  // Sits on the base surface; provides one tier of lift.
  default: palette.surfaceContainer,
  // For "soft" callouts that should recede into the page.
  recessed: palette.surfaceContainerLow,
  // For interactive hero cards. Use sparingly.
  featured: palette.surfaceContainerHigh,
};

/**
 * Card — the workhorse container.
 *
 * No 1px borders, ever (no-line rule). Differentiation is by surface tier.
 */
export function Card({ variant = 'default', padding = 'md', radius = 'lg', style, children, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor: variantBg[variant],
          padding: spacing[padding],
          borderRadius: radii[radius],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
