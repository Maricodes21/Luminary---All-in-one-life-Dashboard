import type { ReactNode } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { SpotifyRecap } from '@/lib/spotify';

type SpotifyDailyRecapProps = {
  recap: SpotifyRecap;
  compact?: boolean;
};

export function SpotifyDailyRecap({ recap, compact = false }: SpotifyDailyRecapProps) {
  return (
    <Card variant={compact ? 'default' : 'featured'} padding={compact ? 'md' : 'lg'}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={compact ? styles.compactHeaderCopy : undefined}>
          <SectionLabel>Listening today</SectionLabel>
          <Text style={[compact ? type.titleLg : type.headlineMd, styles.title, compact && styles.compactCenteredText]}>
            Your day in music
          </Text>
        </View>
        <Text style={[type.labelSm, styles.spotifyAttribution]}>Spotify</Text>
      </View>

      {compact ? <CompactTracks recap={recap} /> : <EditorialRecap recap={recap} />}
      <ListeningStats recap={recap} compact={compact} />
    </Card>
  );
}

function EditorialRecap({ recap }: { recap: SpotifyRecap }) {
  return (
    <>
      {recap.topArtists.length > 0 ? (
        <View style={styles.section}>
          <SectionLabel>Top artists</SectionLabel>
          <View style={styles.artistGrid}>
            {recap.topArtists.map((artist, index) => (
              <SpotifyLink
                key={artist.id}
                url={artist.spotifyUrl}
                label={artist.name}
                style={styles.artistCard}
              >
                <Artwork
                  imageUrl={artist.imageUrl}
                  fallback={artist.name.charAt(0)}
                  style={styles.artistArtwork}
                  radius={radii.lg}
                />
                <View style={styles.rankLine}>
                  <View style={styles.rankBadge}>
                    <Text style={[type.labelSm, styles.rankText]}>{index + 1}</Text>
                  </View>
                  <Text style={[type.labelMd, styles.primaryText]} numberOfLines={1}>
                    {artist.name}
                  </Text>
                </View>
                <Text style={[type.bodySm, styles.mutedText]}>
                  {formatPlayCount(artist.playCount)}
                </Text>
              </SpotifyLink>
            ))}
          </View>
        </View>
      ) : null}

      {recap.topTracks.length > 0 ? (
        <View style={styles.section}>
          <SectionLabel>On repeat</SectionLabel>
          <View style={styles.trackGrid}>
            {recap.topTracks.slice(0, 4).map((track) => (
              <SpotifyLink
                key={track.id}
                url={track.spotifyUrl}
                label={`${track.name} by ${track.artistName}`}
                style={styles.trackCard}
              >
                <Artwork
                  imageUrl={track.albumImageUrl}
                  fallback={track.name.charAt(0)}
                  style={styles.trackArtwork}
                  radius={radii.md}
                />
                <View style={styles.playPill}>
                  <Text style={[type.labelSm, styles.playPillText]}>
                    {formatPlayCount(track.playCount)}
                  </Text>
                </View>
                <Text style={[type.labelMd, styles.primaryText]} numberOfLines={1}>
                  {track.name}
                </Text>
                <Text style={[type.bodySm, styles.mutedText]} numberOfLines={1}>
                  {track.artistName}
                </Text>
              </SpotifyLink>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

function CompactTracks({ recap }: { recap: SpotifyRecap }) {
  return (
    <>
      {recap.topTracks.length ? (
        <View style={styles.compactSection}>
          <SectionLabel>On repeat</SectionLabel>
          <View style={styles.compactTrackGrid}>
            {recap.topTracks.map((track) => (
              <SpotifyLink
                key={track.id}
                url={track.spotifyUrl}
                label={`${track.name} by ${track.artistName}`}
                style={styles.compactTrackCard}
              >
                <Artwork
                  imageUrl={track.albumImageUrl}
                  fallback={track.name.charAt(0)}
                  style={styles.compactArtwork}
                  radius={radii.sm}
                />
                <Text style={[type.labelSm, styles.primaryText, styles.compactCenteredText]} numberOfLines={2}>
                  {track.name}
                </Text>
                <Text style={[type.bodySm, styles.mutedText, styles.compactCenteredText]} numberOfLines={1}>
                  {track.artistName}
                </Text>
                <Text style={[type.labelSm, styles.playPillText]}>{formatPlayCount(track.playCount)}</Text>
              </SpotifyLink>
            ))}
          </View>
        </View>
      ) : null}

      {recap.topArtists.length ? (
        <View style={styles.compactSection}>
          <View style={styles.compactSectionHeading}><SectionLabel>Top artists</SectionLabel></View>
          <View style={styles.compactArtistRow}>
            {recap.topArtists.slice(0, 4).map((artist) => (
              <SpotifyLink key={artist.id} url={artist.spotifyUrl} label={artist.name} style={styles.compactArtist}>
                <Artwork
                  imageUrl={artist.imageUrl}
                  fallback={artist.name.charAt(0)}
                  style={styles.compactArtistImage}
                  radius={radii.pill}
                />
                <Text style={[type.labelSm, styles.primaryText, styles.compactArtistName]} numberOfLines={1}>
                  {artist.name}
                </Text>
              </SpotifyLink>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

function ListeningStats({ recap, compact }: { recap: SpotifyRecap; compact: boolean }) {
  const stats = [
    { value: recap.minutesListened, label: 'min played' },
    { value: recap.artistCount, label: 'artists played' },
    { value: recap.trackCount, label: 'tracks played' },
  ];

  return (
    <View style={[styles.statsRow, compact && styles.statsRowCompact]}>
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.statTile, compact && styles.statTileCompact]}>
          <Text style={[compact ? type.titleLg : type.displayMd, styles.statValue]}>{stat.value}</Text>
          <Text style={[type.labelSm, styles.mutedText]} numberOfLines={1}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

function Artwork({
  imageUrl,
  fallback,
  style,
  radius,
}: {
  imageUrl?: string;
  fallback: string;
  style: StyleProp<ImageStyle & ViewStyle>;
  radius: number;
}) {
  return imageUrl ? (
    <Image source={{ uri: imageUrl }} style={[style, { borderRadius: radius }]} resizeMode="cover" />
  ) : (
    <View style={[style, styles.artworkFallback, { borderRadius: radius }]}>
      <Text style={[type.titleLg, styles.mutedText]}>{fallback}</Text>
    </View>
  );
}

function SpotifyLink({
  url,
  label,
  style,
  children,
}: {
  url?: string;
  label: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  if (!url) return <View style={style}>{children}</View>;
  return (
    <Pressable
      onPress={() => {
        Linking.openURL(url).catch((error: unknown) => console.warn('[SpotifyDailyRecap] link error', error));
      }}
      accessibilityRole="link"
      accessibilityLabel={`Open ${label} in Spotify`}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

function formatPlayCount(count: number): string {
  return `${count} ${count === 1 ? 'play' : 'plays'}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCompact: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  compactHeaderCopy: { alignItems: 'flex-start', flex: 1 },
  title: { color: palette.onSurface, marginTop: spacing.xs },
  spotifyAttribution: { color: palette.primary },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  artistGrid: { flexDirection: 'row', gap: spacing.sm },
  artistCard: { flex: 1, minWidth: 0 },
  artistArtwork: { width: '100%', aspectRatio: 1 },
  rankLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  rankText: { color: palette.onPrimary },
  trackGrid: { flexDirection: 'row', gap: spacing.sm },
  trackCard: { flex: 1, minWidth: 0 },
  trackArtwork: { width: '100%', aspectRatio: 1 },
  playPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHighest,
  },
  playPillText: { color: palette.primary },
  primaryText: { color: palette.onSurface },
  mutedText: { color: palette.onSurfaceVariant },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  statsRowCompact: { marginTop: spacing.md },
  statTile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHighest,
  },
  statTileCompact: { paddingVertical: spacing.sm },
  statValue: { color: palette.onSurface },
  compactSection: { marginTop: spacing.md, alignItems: 'center', gap: spacing.sm },
  compactSectionHeading: { alignItems: 'center' },
  compactTrackGrid: { alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm },
  compactTrackCard: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 },
  compactArtwork: { width: '100%', maxWidth: 68, aspectRatio: 1 },
  compactCenteredText: { width: '100%', textAlign: 'center' },
  compactArtistRow: { alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm },
  compactArtist: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs },
  compactArtistImage: { width: 38, height: 38 },
  compactArtistName: { width: '100%', textAlign: 'center' },
  artworkFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHighest,
  },
  pressed: { opacity: 0.72 },
});
