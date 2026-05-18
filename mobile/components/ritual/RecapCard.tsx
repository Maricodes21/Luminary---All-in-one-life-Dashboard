import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { mapAudioFeaturesToMood, moodCopy } from '@/lib/mood';
import type { SpotifyRecap } from '@/lib/spotify';

type RecapCardProps = {
  recap: SpotifyRecap;
};

export function RecapCard({ recap }: RecapCardProps) {
  const { label, confidence } = mapAudioFeaturesToMood(recap.averageFeatures);
  const copy = moodCopy[label];
  const artistNames = recap.topArtists.map((a) => a.name).join(', ');
  const confident = confidence >= 0.6;

  return (
    <Card variant="featured">
      <SectionLabel>Today's soundtrack</SectionLabel>

      <View style={styles.statsRow}>
        <Text style={[type.displayMd, styles.stat]}>
          {recap.trackCount}
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}> tracks</Text>
        </Text>
        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}> · </Text>
        <Text style={[type.displayMd, styles.stat]}>
          {recap.minutesListened}
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}> min</Text>
        </Text>
      </View>

      {artistNames.length > 0 && (
        <Text style={[type.bodySm, styles.artists]} numberOfLines={2}>
          {artistNames}
        </Text>
      )}

      <View style={styles.moodRow}>
        <View style={styles.moodPill}>
          <Text style={[type.titleLg, { color: palette.primary }]}>
            {confident ? copy.display : `Maybe ${copy.display.toLowerCase()}`}
          </Text>
        </View>
        <Text style={[type.bodySm, styles.moodHint]}>
          From your music today
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  stat: {
    color: palette.onSurface,
  },
  artists: {
    color: palette.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  moodRow: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  moodPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${palette.primary}18`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  moodHint: {
    color: palette.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
});
