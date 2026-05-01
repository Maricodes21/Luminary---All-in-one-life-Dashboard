import { Text, TextProps } from 'react-native';
import { palette, type } from '@luminary/design-system';

/**
 * Mission-control style data tag. Always uppercase + tracked. Use above
 * a card header or section title to give the "magazine" feel from DESIGN.md.
 */
export function SectionLabel({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[type.labelSm, { color: palette.onSurfaceVariant }, style]}>
      {children}
    </Text>
  );
}
