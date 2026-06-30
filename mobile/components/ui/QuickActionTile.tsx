import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Icon } from '@/components/ui/Icon';

type QuickActionTileProps = {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  detail?: string;
  accent?: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export function QuickActionTile({
  icon,
  label,
  detail,
  accent = palette.primary,
  onPress,
  style,
}: QuickActionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }, style]}
      accessibilityRole="button"
    >
      <View style={[styles.iconWrap, { backgroundColor: `${accent}24` }]}>
        <Icon name={icon} size={20} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.labelMd, styles.label]} numberOfLines={1}>
          {label}
        </Text>
        {detail ? (
          <Text style={[type.bodySm, styles.detail]} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 138,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: palette.onSurface },
  detail: { color: palette.onSurfaceVariant, marginTop: 2 },
});
