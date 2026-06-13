/**
 * Tab navigator — 4 visible tabs (Home, Journal, Health, Money) with a
 * floating ritual FAB overlay.
 *
 * The FAB is rendered as an absolutely-positioned button OUTSIDE the
 * <Tabs> navigator. This keeps the file-routing tree honest (no phantom
 * "ritual" tab screen) while still giving us the visual center button.
 *
 * Resolved per design decision 2026-05-01.
 */
import { Tabs, useRouter } from 'expo-router';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { palette, spacing, radii, glass } from '@luminary/design-system';
import { Icon } from '@/components/ui/Icon';

export default function TabsLayout() {
  return (
    <View style={styles.host}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontFamily: 'Inter_700Bold',
            fontSize: 10,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginTop: 2,
          },
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.onSurfaceVariant,
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: 0, // No-line rule.
            backgroundColor: 'transparent',
            height: 84,
            paddingBottom: 18,
            paddingTop: 8,
          },
          tabBarBackground: () => (
            <BlurView intensity={glass.intensity} tint={glass.tint} style={StyleSheet.absoluteFill}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: glass.fallbackBackground }]} />
            </BlurView>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: 'Journal',
            tabBarIcon: ({ color }) => <Icon name="journal" color={color} />,
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: 'Health',
            tabBarIcon: ({ color }) => <Icon name="health" color={color} />,
          }}
        />
        <Tabs.Screen
          name="money"
          options={{
            title: 'Money',
            tabBarIcon: ({ color }) => <Icon name="money" color={color} />,
          }}
        />
      </Tabs>

      <RitualFab />
    </View>
  );
}

function RitualFab() {
  const router = useRouter();
  const onPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
        /* noop */
      });
    }
    router.push('/ritual');
  };
  return (
    // box-none on the overlay so taps on empty edges pass through to tabs beneath.
    // The Pressable itself must NOT have pointer-events restrictions.
    <View style={styles.fabOverlay} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Begin tonight's ritual"
        style={styles.fabButton}
      >
        <Icon name="sparkles" size={26} color={palette.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: palette.surface },
  fabOverlay: {
    position: 'absolute',
    bottom: 56, // sits above the tab bar (84 height − a slight overlap)
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.surfaceTint,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
