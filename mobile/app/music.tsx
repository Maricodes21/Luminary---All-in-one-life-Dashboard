import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { SpotifyDailyRecap } from '@/components/spotify/SpotifyDailyRecap';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { moodCopy } from '@/lib/mood';
import { fetchRecap } from '@/lib/spotify';
import { getLocalDateKey, isSpotifyRecapEligible, LISTENING_TAGS } from '@/lib/spotifyRecap';
import { useDailySignalsStore } from '@/stores/useDailySignalsStore';
import { useRitualStore } from '@/stores/useRitualStore';

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';

export default function MusicRecapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const date = getLocalDateKey(new Date());
  const [correcting, setCorrecting] = useState(false);
  const { data: recap, isFetching, error, refetch } = useQuery({
    queryKey: ['spotify-recap', date],
    queryFn: () => fetchRecap(CLIENT_ID),
    staleTime: 1000 * 60 * 60,
  });
  const correctedTag = useDailySignalsStore((s) => s.musicTagCorrections[date]);
  const setMusicTag = useDailySignalsStore((s) => s.setMusicTag);
  const ritualSession = useRitualStore((state) => state.session);
  const userMood = ritualSession.localDate === date ? ritualSession.mood : null;
  const listeningTag = correctedTag ?? recap?.listeningTag;

  return (
    <View style={styles.root}>
      <View style={[styles.topbar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Icon name="back" size={20} color={palette.onSurface} />
        </Pressable>
        <View style={styles.topbarCopy}>
          <SectionLabel>Listening today</SectionLabel>
          <Text style={[type.titleMd, { color: palette.onSurface }]}>Your music recap</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        {isFetching && !recap ? <ActivityIndicator color={palette.primary} style={styles.loading} /> : null}
        {error ? (
          <Card><Text style={[type.bodyMd, styles.muted]}>Your listening recap could not be loaded.</Text><Pressable onPress={() => refetch()} style={styles.primary}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Try again</Text></Pressable></Card>
        ) : null}
        {!isFetching && !error && !isSpotifyRecapEligible(recap) ? (
          <Card variant="recessed"><Text style={[type.titleLg, { color: palette.onSurface }]}>A recap is still taking shape.</Text><Text style={[type.bodySm, styles.muted, { marginTop: spacing.xs }]}>It appears after at least 30 minutes and five plays today.</Text></Card>
        ) : null}
        {isSpotifyRecapEligible(recap) ? (
          <>
            <SpotifyDailyRecap
              recap={recap}
              listeningTag={listeningTag}
              userMood={userMood ? moodCopy[userMood].display : null}
            />

            <Card>
              <SectionLabel>Listening pattern</SectionLabel>
              <View style={styles.factGrid}>
                <Fact value={recap.allTracks.length} label="different songs" />
                <Fact value={recap.allTracks[0]?.playCount ?? 1} label="top repeat count" />
              </View>
              <Text style={[type.bodyMd, styles.muted, { marginTop: spacing.md }]}>You listened during {recap.listeningWindows.join(', ').toLowerCase()}.</Text>
              {recap.firstPlayedAt && recap.lastPlayedAt ? (
                <Text style={[type.bodySm, styles.muted, { marginTop: spacing.xs }]}>First play {formatTime(recap.firstPlayedAt)} · last play {formatTime(recap.lastPlayedAt)}</Text>
              ) : null}
            </Card>

            <Card>
              <SectionLabel>Every repeat</SectionLabel>
              <View style={styles.trackList}>
                {recap.allTracks.map((track, index) => (
                  <Pressable key={track.id} onPress={() => track.spotifyUrl && Linking.openURL(track.spotifyUrl).catch(() => undefined)} style={styles.trackRow} accessibilityRole={track.spotifyUrl ? 'link' : undefined}>
                    {track.albumImageUrl ? <Image source={{ uri: track.albumImageUrl }} style={styles.artwork} /> : <View style={styles.artwork} />}
                    <Text style={[type.labelMd, { color: palette.primary, width: spacing.lg }]}>{index + 1}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[type.titleMd, { color: palette.onSurface }]} numberOfLines={1}>{track.name}</Text>
                      <Text style={[type.bodySm, styles.muted]} numberOfLines={1}>{track.artistName}</Text>
                    </View>
                    <Text style={[type.labelSm, { color: palette.primary }]}>{track.playCount}×</Text>
                  </Pressable>
                ))}
              </View>
            </Card>

            <Card>
              <SectionLabel>Listening tag</SectionLabel>
              <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs, textTransform: 'capitalize' }]}>{listeningTag}</Text>
              <Text style={[type.bodySm, styles.muted, { marginTop: spacing.xs }]}>This describes the music pattern. It does not decide your mood.</Text>
              {correcting ? (
                <View style={styles.tags}>
                  {LISTENING_TAGS.map((tag) => (
                    <Pressable key={tag} onPress={() => { setMusicTag(date, tag); setCorrecting(false); }} style={[styles.tag, tag === listeningTag && styles.tagSelected]} accessibilityRole="radio" accessibilityState={{ selected: tag === listeningTag }}>
                      <Text style={[type.labelSm, { color: tag === listeningTag ? palette.onPrimary : palette.onSurfaceVariant, textTransform: 'capitalize' }]}>{tag}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Pressable onPress={() => setCorrecting(true)} style={styles.secondary} accessibilityRole="button">
                  <Icon name="edit" size={17} color={palette.primary} />
                  <Text style={[type.labelMd, { color: palette.primary }]}>Not quite right.</Text>
                </Pressable>
              )}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Fact({ value, label }: { value: number; label: string }) {
  return <View style={styles.fact}><Text style={[type.displayMd, { color: palette.onSurface }]}>{value}</Text><Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{label}</Text></View>;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  topbarCopy: { alignItems: 'center' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, gap: spacing.md },
  loading: { marginTop: spacing.xl },
  muted: { color: palette.onSurfaceVariant },
  primary: { marginTop: spacing.md, minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.primary },
  secondary: { marginTop: spacing.md, minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  factGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  fact: { flex: 1, padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh },
  trackList: { marginTop: spacing.sm, gap: spacing.sm },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh },
  artwork: { width: spacing['2xl'], height: spacing['2xl'], borderRadius: radii.sm, backgroundColor: palette.surfaceContainerHighest },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: palette.surfaceContainerHighest },
  tagSelected: { backgroundColor: palette.primary },
});
