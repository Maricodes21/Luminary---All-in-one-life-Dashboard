/**
 * Tab navigator - 5 visible tabs (Home, Journal, Meals, Health, Money).
 */
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { palette, glass } from '@luminary/design-system';
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
            borderTopWidth: 0,
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
          name="meals"
          options={{
            title: 'Meals',
            tabBarIcon: ({ color }) => <Icon name="meals" color={color} />,
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
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: palette.surface },
});
