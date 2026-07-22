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
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { moodCopy, type MoodLabel } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';

type SpotifyDailyRecapProps = {
  recap: SpotifyRecap;
  compact?: boolean;
  confirmedMood?: MoodLabel | null;
  moodSkipped?: boolean;
  onOpenSummary?: () => void;
};

export function SpotifyDailyRecap({
  recap,
  compact = false,
  confirmedMood = null,
  moodSkipped = false,
  onOpenSummary,
}: SpotifyDailyRecapProps) {
  if (compact) {
    return (
      <LuminaryHomeRecap
        recap={recap}
        confirmedMood={confirmedMood}
        moodSkipped={moodSkipped}
        onOpenSummary={onOpenSummary}
      />
    );
  }

  return (
    <Card variant="featured" padding="lg">
      <View style={styles.header}>
        <View>
          <SectionLabel>Listening today</SectionLabel>
          <Text style={[type.headlineMd, styles.title]}>
            Your day in music
          </Text>
        </View>
        <Text style={[type.labelSm, styles.spotifyAttribution]}>Spotify</Text>
      </View>

      <EditorialRecap recap={recap} />
      <ListeningStats recap={recap} compact={false} />
    </Card>
  );
}

function LuminaryHomeRecap({
  recap,
  confirmedMood,
  moodSkipped,
  onOpenSummary,
}: {
  recap: SpotifyRecap;
  confirmedMood: MoodLabel | null;
  moodSkipped: boolean;
  onOpenSummary?: () => void;
}) {
  const tracks = recap.topTracks.slice(0, 4);
  const artists = recap.topArtists.slice(0, 4);
  const moodLabel = moodSkipped
    ? 'Mood skipped'
    : confirmedMood
      ? `${moodCopy[confirmedMood].display} · confirmed`
      : 'Listening kept';
  const moodDetail = moodSkipped
    ? 'Music stayed in the recap without deciding how you felt.'
    : confirmedMood
      ? 'You confirmed or adjusted this listening signal in tonight’s ritual.'
      : 'Your listening stayed connected to tonight without defining your mood.';

  return (
    <Card variant="featured" padding="md" style={styles.homeCard}>
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderCopy}>
          <SectionLabel>Listening today</SectionLabel>
          <Text style={[type.headlineMd, styles.title]}>Your day in music.</Text>
        </View>
        <View style={styles.spotifyPill}>
          <View style={styles.spotifyDot} />
          <Text style={[type.labelSm, styles.spotifyAttribution]}>Spotify</Text>
        </View>
      </View>

      <View style={styles.homeRecapBody}>
        <View style={styles.coverGrid} accessibilityLabel="Four most-played tracks today">
          <View style={styles.coverRow}>
            {tracks.slice(0, 2).map((track) => (
              <Artwork
                key={track.id}
                imageUrl={track.albumImageUrl}
                fallback={track.name.charAt(0)}
                style={styles.coverArtwork}
                radius={radii.sm}
              />
            ))}
          </View>
          <View style={styles.coverRow}>
            {tracks.slice(2, 4).map((track) => (
              <Artwork
                key={track.id}
                imageUrl={track.albumImageUrl}
                fallback={track.name.charAt(0)}
                style={styles.coverArtwork}
                radius={radii.sm}
              />
            ))}
          </View>
        </View>

        <View style={styles.moodPanel}>
          <SectionLabel>Tonight’s read</SectionLabel>
          <Text style={[type.headlineSm, styles.moodTitle]}>{moodLabel}</Text>
          <Text style={[type.bodySm, styles.moodCopy]}>{moodDetail}</Text>
        </View>
      </View>

      <View style={styles.rankingList}>
        {tracks.length ? (
          <View style={styles.rankingRow}>
            <SectionLabel>Top tracks</SectionLabel>
            <Text style={[type.bodySm, styles.rankingCopy]} numberOfLines={2}>
              {tracks.map((track) => track.name).join(' · ')}
            </Text>
          </View>
        ) : null}
        {artists.length ? (
          <View style={styles.rankingRow}>
            <SectionLabel>Top artists</SectionLabel>
            <Text style={[type.bodySm, styles.rankingCopy]} numberOfLines={2}>
              {artists.map((artist) => artist.name).join(' · ')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.homeFooter}>
        <View style={styles.footerStats}>
          <Text style={[type.labelSm, styles.footerStat]}>
            <Text style={styles.footerStatValue}>{recap.minutesListened}</Text> minutes
          </Text>
          <Text style={[type.labelSm, styles.footerStat]}>
            <Text style={styles.footerStatValue}>{recap.trackCount}</Text> tracks
          </Text>
        </View>
        {onOpenSummary ? (
          <Pressable
            onPress={onOpenSummary}
            style={({ pressed }) => [styles.summaryButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="See tonight’s completed recap"
          >
            <Text style={[type.labelSm, styles.summaryButtonText]}>See tonight’s recap</Text>
            <View style={styles.summaryArrow}>
              <Icon name="back" size={spacing.md} color={palette.primary} />
            </View>
          </Pressable>
        ) : null}
      </View>
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
  title: { color: palette.onSurface, marginTop: spacing.xs },
  spotifyAttribution: { color: palette.primary },
  homeCard: { gap: spacing.md, backgroundColor: palette.surfaceContainerHigh },
  homeHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  homeHeaderCopy: { flex: 1 },
  spotifyPill: { minHeight: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.pill, backgroundColor: palette.surfaceContainerHighest },
  spotifyDot: { width: spacing.xs, height: spacing.xs, borderRadius: radii.pill, backgroundColor: palette.primary },
  homeRecapBody: { flexDirection: 'row', gap: spacing.sm },
  coverGrid: { flex: 1, gap: spacing.xs },
  coverRow: { flexDirection: 'row', flex: 1, gap: spacing.xs },
  coverArtwork: { flex: 1, aspectRatio: 1 },
  moodPanel: { flex: 1, justifyContent: 'center', padding: spacing.sm, borderRadius: radii.md, backgroundColor: palette.surfaceContainer },
  moodTitle: { color: palette.primary, marginTop: spacing.sm },
  moodCopy: { color: palette.onSurfaceVariant, marginTop: spacing.xs },
  rankingList: { gap: spacing.sm },
  rankingRow: { gap: spacing.xs, padding: spacing.sm, borderRadius: radii.md, backgroundColor: palette.surfaceContainer },
  rankingCopy: { color: palette.onSurface },
  homeFooter: { gap: spacing.sm },
  footerStats: { flexDirection: 'row', gap: spacing.md },
  footerStat: { color: palette.onSurfaceVariant },
  footerStatValue: { color: palette.onSurface },
  summaryButton: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHighest },
  summaryButtonText: { color: palette.primary },
  summaryArrow: { transform: [{ rotate: '180deg' }] },
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
  artworkFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHighest,
  },
  pressed: { opacity: 0.72 },
});
