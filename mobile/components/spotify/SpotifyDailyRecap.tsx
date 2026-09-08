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
import { moodCopy, type MoodLabel } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';
import type { ListeningTag } from '@/lib/spotifyRecap';

type SpotifyDailyRecapProps = {
  recap: SpotifyRecap;
  compact?: boolean;
  confirmedMood?: MoodLabel | null;
  moodSkipped?: boolean;
  listeningTag?: ListeningTag | null;
  userMood?: string | null;
  onOpenSummary?: () => void;
};

export function SpotifyDailyRecap({
  recap,
  compact = false,
  confirmedMood = null,
  moodSkipped = false,
  listeningTag = recap.listeningTag,
  userMood = null,
  onOpenSummary,
}: SpotifyDailyRecapProps) {
  if (compact) {
    return (
      <LuminaryHomeRecap
        recap={recap}
        confirmedMood={confirmedMood}
        moodSkipped={moodSkipped}
        listeningTag={listeningTag}
        userMood={userMood}
        onOpenSummary={onOpenSummary}
      />
    );
  }

  return (
    <Card variant="featured" padding="lg">
      <View style={styles.header}>
        <View>
          <SectionLabel>Listening today</SectionLabel>
          <Text style={[type.headlineMd, styles.title]}>Your day in music</Text>
        </View>
        <Text style={[type.labelSm, styles.spotifyAttribution]}>● Spotify</Text>
      </View>
      {listeningTag ? (
        <Text style={[type.bodySm, styles.signalCopy]}>
          {userMood
            ? `${userMood} + ${listeningTag} today.`
            : `Your music was ${listeningTag} today.`}
        </Text>
      ) : null}
      <EditorialRecap recap={recap} />
      <ListeningStats recap={recap} compact={false} />
    </Card>
  );
}

function LuminaryHomeRecap({
  recap,
  confirmedMood,
  moodSkipped,
  listeningTag,
  userMood,
  onOpenSummary,
}: {
  recap: SpotifyRecap;
  confirmedMood: MoodLabel | null;
  moodSkipped: boolean;
  listeningTag: ListeningTag | null;
  userMood: string | null;
  onOpenSummary?: () => void;
}) {
  const tracks = recap.topTracks.slice(0, 4);
  const artists = recap.topArtists.slice(0, 4);
  const reportedMood = userMood ?? (confirmedMood ? moodCopy[confirmedMood].display : null);
  const moodLabel = listeningTag
    ? reportedMood
      ? `${reportedMood} + ${listeningTag}`
      : `Your music was ${listeningTag}`
    : moodSkipped
      ? 'Mood left open'
      : reportedMood ?? 'Listening kept separate';
  const card = (
    <Card variant="featured" padding="md" style={styles.homeCard}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderCopy}>
          <SectionLabel>Listening today</SectionLabel>
          <Text style={[type.headlineMd, styles.title]}>Your day in music.</Text>
        </View>
        <View style={styles.spotifyMark}>
          <View style={styles.spotifyDot} />
          <Text style={[type.labelSm, styles.spotifyAttribution]}>Spotify</Text>
        </View>
      </View>

      <View style={styles.homeRecapBody}>
        <View style={styles.coverGrid} accessibilityLabel="Four most-played tracks today">
          {[0, 1].map((row) => (
            <View key={row} style={styles.coverRow}>
              {[0, 1].map((column) => {
                const track = tracks[row * 2 + column];
                return track ? (
                  <Artwork
                    key={track.id}
                    imageUrl={track.albumImageUrl}
                    fallback={track.name.charAt(0)}
                    style={styles.coverArtwork}
                    radius={radii.sm}
                  />
                ) : (
                  <View key={`empty-${row}-${column}`} style={styles.coverPlaceholder}>
                    <Text style={[type.labelSm, styles.mutedText]}>♪</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.moodPanel}>
          <SectionLabel>Listening tag</SectionLabel>
          <Text style={[type.headlineSm, styles.moodTitle]}>{moodLabel}</Text>
          <Text style={[type.bodySm, styles.moodCopy]}>Your music adds context. Your mood stays yours.</Text>
        </View>
      </View>

      <View style={styles.rankingList}>
        {tracks.length ? (
          <View style={styles.rankingRow}>
            <Text style={[type.labelSm, styles.rankingLabel]}>Top tracks</Text>
            <Text style={[type.labelSm, styles.rankingCopy]}>
              {tracks.map((track) => track.name).join(' · ')}
            </Text>
          </View>
        ) : null}
        {artists.length ? (
          <View style={styles.rankingRow}>
            <Text style={[type.labelSm, styles.rankingLabel]}>Top artists</Text>
            <Text style={[type.labelSm, styles.rankingCopy]}>
              {artists.map((artist) => artist.name).join(' · ')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.homeFooter}>
        <Metric value={recap.minutesListened} label="minutes" />
        <Metric value={recap.trackCount} label="tracks" />
        {onOpenSummary ? (
          <View style={styles.summaryButton}>
            <Text style={[type.labelSm, styles.summaryButtonText]}>See listening detail →</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
  return onOpenSummary ? (
    <Pressable
      onPress={onOpenSummary}
      accessibilityRole="button"
      accessibilityLabel="Open today’s music recap"
      style={({ pressed }) => pressed && styles.pressed}
    >
      {card}
    </Pressable>
  ) : card;
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[type.titleLg, styles.metricValue]}>{value}</Text>
      <Text style={[type.labelSm, styles.metricLabel]}>{label}</Text>
    </View>
  );
}

function EditorialRecap({ recap }: { recap: SpotifyRecap }) {
  return (
    <>
      {recap.topArtists.length > 0 ? (
        <View style={styles.section}>
          <SectionLabel>Top artists</SectionLabel>
          <View style={styles.artistGrid}>
            {recap.topArtists.slice(0, 4).map((artist, index) => (
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
          <Text style={[compact ? type.titleLg : type.displayMd, styles.statValue]}>
            {stat.value}
          </Text>
          <Text style={[type.labelSm, styles.mutedText]} numberOfLines={1}>
            {stat.label}
          </Text>
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
    <Image
      source={{ uri: imageUrl }}
      style={[style, { borderRadius: radius }]}
      resizeMode="cover"
    />
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
      onPress={() =>
        Linking.openURL(url).catch((error: unknown) =>
          console.warn('[SpotifyDailyRecap] link error', error),
        )
      }
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
  signalCopy: { color: palette.onSurfaceVariant, marginTop: spacing.sm },
  spotifyAttribution: { color: palette.tertiary },
  homeCard: { backgroundColor: palette.surfaceContainerHigh, overflow: 'hidden' },
  ambientGlow: {
    position: 'absolute',
    top: -spacing['3xl'],
    right: -spacing['3xl'],
    width: 144,
    height: 144,
    borderRadius: radii.pill,
    backgroundColor: palette.primaryContainer,
    opacity: 0.08,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  homeHeaderCopy: { flex: 1 },
  spotifyMark: {
    minHeight: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spotifyDot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.tertiary,
  },
  homeRecapBody: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  coverGrid: { flex: 0.82, gap: spacing.xs },
  coverRow: { flexDirection: 'row', gap: spacing.xs },
  coverArtwork: { flex: 1, aspectRatio: 1 },
  coverPlaceholder: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceContainerHighest,
  },
  moodPanel: { flex: 1.18, justifyContent: 'center', paddingLeft: spacing.xs },
  moodTitle: { color: palette.primary, marginTop: spacing.sm },
  moodCopy: { color: palette.onSurfaceVariant, marginTop: spacing.xs },
  rankingList: { gap: spacing.sm, marginTop: spacing.md },
  rankingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  rankingLabel: { width: spacing['3xl'], color: palette.onSurfaceVariant },
  rankingCopy: {
    flex: 1,
    minWidth: 0,
    color: palette.onSurface,
    textTransform: 'none',
    letterSpacing: 0,
  },
  homeFooter: {
    minHeight: spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metric: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  metricValue: { color: palette.onSurface },
  metricLabel: { color: palette.onSurfaceVariant },
  summaryButton: {
    flex: 1,
    minHeight: spacing['2xl'],
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  summaryButtonText: { color: palette.primary, textAlign: 'right' },
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
