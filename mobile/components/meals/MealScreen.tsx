import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, type } from '@luminary/design-system';

import { Icon } from '@/components/ui/Icon';

export function MealScreen({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back"><Icon name="back" size={20} /></Pressable>
        <View style={styles.heading}>
          <Text style={[type.headlineMd, { color: palette.onSurface }]} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0 },
  action: { minWidth: 40, minHeight: 40, alignItems: 'flex-end', justifyContent: 'center' },
});
