/**
 * Home — the calm "day surface."
 * Greets the user, shows today's habits + Friend Card observation, and
 * surfaces visible-but-locked previews of the other modules.
 *
 * The Home tab is intentionally NOT where the ritual happens. The ritual lives
 * behind the center FAB to keep this surface meditative.
 */
import { ScrollView, View, Text, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchRecap, type SpotifyRecap } from '@/lib/spotify';

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';

function useHomeSpotifyRecap() {
  return useQuery<SpotifyRecap | null>({
    queryKey: ['spotify-recap', 'home'],
    queryFn: () => fetchRecap(SPOTIFY_CLIENT_ID),
    staleTime: 1000 * 60 * 60, // 1 hour — recap doesn't change during the day
    retry: 1,
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const displayName = useAuthStore((s) => s.displayName);
  const { data: recap } = useHomeSpotifyRecap();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>Welcome back</Text>
          <Text style={[type.headlineLg, { color: palette.primary, marginTop: 2 }]}>{displayName ?? 'Luminary'}</Text>
        </View>
      </View>

      {/* Spotify listening recap — only shown when data is available */}
      {recap && <SpotifyHomeCard recap={recap} />}

      {/* Friend Card — daily editorial observation. Templates pre-MVP. */}
      <Card variant="recessed" style={styles.spaced}>
        <SectionLabel>Today's note</SectionLabel>
        <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
          A quiet start. The week is still yours.
        </Text>
      </Card>

      {/* Habits today — surfaces the ritual quietly */}
      <View style={styles.spaced}>
        <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Habits today</Text>
        <Card>
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
            Your habits live here. Tap the center button below to begin tonight's ritual.
          </Text>
        </Card>
      </View>

      {/* Locked module preview — Health */}
      <View style={styles.spaced}>
        <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Health</Text>
        <Card variant="recessed" style={styles.lockedRow}>
          <Icon name="lock" size={20} color={palette.onSurfaceVariant} />
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, flex: 1, marginLeft: spacing.sm }]}>
            Open this when you're ready.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

function SpotifyHomeCard({ recap }: { recap: SpotifyRecap }) {
  return (
    <Card style={styles.spaced}>
      <View style={styles.recapCenter}>
        <SectionLabel>Listening today</SectionLabel>

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

        {recap.topArtists.length > 0 && <ArtistRow artists={recap.topArtists} />}
      </View>
    </Card>
  );
}

function ArtistRow({ artists }: { artists: SpotifyRecap['topArtists'] }) {
  return (
    <View style={styles.artistRow}>
      <View style={styles.artistAvatars}>
        {artists.map((artist) => (
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
        style={[type.labelSm, { color: palette.onSurfaceVariant, marginTop: spacing.xs, textAlign: 'center' }]}
        numberOfLines={1}
      >
        {artists.map((a) => a.name).join(' · ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  spaced: { marginTop: spacing.sm },
  lockedRow: { flexDirection: 'row', alignItems: 'center' },
  recapCenter: {
    alignItems: 'center',
  },
  statTiles: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    maxWidth: 130,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceContainerHigh,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: palette.surfaceContainerHigh,
  },
  artistImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  artistImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
