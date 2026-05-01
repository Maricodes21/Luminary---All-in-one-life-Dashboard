import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, type } from '@luminary/design-system';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text style={[type.displaySm, { color: palette.onSurface }]}>This screen doesn't exist.</Text>
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.sm }]}>
          Let's get you back to where you were.
        </Text>
        <Link href="/" style={{ marginTop: spacing.lg }}>
          <Text style={[type.titleMd, { color: palette.primary }]}>Take me home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    padding: spacing.lg,
  },
});
