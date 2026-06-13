import { View, Text, Image, StyleSheet } from 'react-native';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { SpotifyRecap } from '@/lib/spotify';

type RecapCardProps = {
  recap: SpotifyRecap;
};

export function RecapCard({ recap }: RecapCardProps) {
  return (
    <Card variant="featured">
      <View style={styles.center}>
        <SectionLabel>Today's soundtrack</SectionLabel>

        <View style={styles.statTiles}>
          <View style={styles.statTile}>
            <Text style={[type.displayMd, { color: palette.onSurface }]}>{recap.minutesListened}</Text>
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>min played</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[type.displayMd, { color: palette.onSurface }]}>{recap.trackCount}</Text>
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>tracks</Text>
          </View>
        </View>

        {recap.topArtists.length > 0 && (
          <View style={styles.artistRow}>
            <View style={styles.artistAvatars}>
              {recap.topArtists.map((artist) => (
                <View key={artist.id} style={styles.artistAvatar}>
                  {artist.imageUrl ? (
                    <Image source={{ uri: artist.imageUrl }} style={styles.artistImage} />
                  ) : (
                    <View style={[styles.artistImage, styles.artistImageFallback]}>
                      <Text style={[type.titleMd, { color: palette.onSurfaceVariant }]}>
                        {artist.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <Text
              style={[
                type.bodySm,
                { color: palette.onSurfaceVariant, marginTop: spacing.xs, textAlign: 'center' },
              ]}
              numberOfLines={1}
            >
              {recap.topArtists.map((a) => a.name).join(' · ')}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  statTiles: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  statTile: {
    flex: 1,
    maxWidth: 150,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceContainerHighest,
    borderRadius: radii.md,
  },
  artistRow: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  artistAvatars: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  artistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: palette.surfaceContainerHigh,
  },
  artistImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  artistImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
