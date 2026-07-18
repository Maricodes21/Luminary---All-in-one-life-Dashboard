import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { palette, spacing, type } from '@luminary/design-system';

WebBrowser.maybeCompleteAuthSession();

export default function SpotifyCallbackScreen() {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={palette.primary} />
      <Text style={[type.bodyMd, styles.copy]}>Finishing your Spotify connection...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: palette.surface },
  copy: { color: palette.onSurfaceVariant },
});
