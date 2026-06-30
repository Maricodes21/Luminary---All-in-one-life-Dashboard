import { useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore } from '@/stores/useProductionStore';
import { fetchRecap, type SpotifyRecap } from '@/lib/spotify';

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';

function useHomeSpotifyRecap() {
  return useQuery<SpotifyRecap | null>({
    queryKey: ['spotify-recap', 'home'],
    queryFn: () => fetchRecap(SPOTIFY_CLIENT_ID),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const displayName = useAuthStore((s) => s.displayName);
  const { data: recap } = useHomeSpotifyRecap();
  const [habitName, setHabitName] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const habits = useProductionStore((s) =>
    s.habits.filter((habit) => !habit.archivedAt).sort((a, b) => a.position - b.position),
  );
  const addHabit = useProductionStore((s) => s.addHabit);
  const updateHabit = useProductionStore((s) => s.updateHabit);
  const archiveHabit = useProductionStore((s) => s.archiveHabit);
  const toggleHabitCompletion = useProductionStore((s) => s.toggleHabitCompletion);
  const syncQueue = useProductionStore((s) => s.syncQueue);
  const completedToday = habits.filter((habit) => habit.completedOn.includes(today)).length;

  const onAddHabit = () => {
    if (!habitName.trim()) return;
    addHabit(habitName);
    setHabitName('');
  };

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

      {recap && <SpotifyHomeCard recap={recap} />}

      <Card variant="recessed" style={styles.spaced}>
        <SectionLabel>Today's note</SectionLabel>
        <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
          A quiet start. The week is still yours.
        </Text>
      </Card>

      <View style={styles.spaced}>
        <View style={styles.sectionHeader}>
          <Text style={[type.headlineMd, { color: palette.onSurface }]}>Habits today</Text>
          <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
            {completedToday} of {habits.length} captured
          </Text>
        </View>
        <Card>
          <View style={styles.addRow}>
            <TextInput
              value={habitName}
              onChangeText={setHabitName}
              placeholder="Pick something small"
              placeholderTextColor={palette.onSurfaceVariant}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={onAddHabit}
            />
            <Pressable onPress={onAddHabit} style={styles.smallButton} accessibilityRole="button">
              <Text style={[type.labelMd, { color: palette.onPrimary }]}>Add</Text>
            </Pressable>
          </View>

          {habits.map((habit) => {
            const completed = habit.completedOn.includes(today);
            return (
              <View key={habit.id} style={styles.habitRow}>
                <Pressable
                  onPress={() => toggleHabitCompletion(habit.id, today)}
                  style={[styles.check, completed && styles.checkActive]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: completed }}
                >
                  <Text style={[type.labelMd, { color: completed ? palette.onPrimary : palette.onSurfaceVariant }]}>
                    {completed ? 'ok' : ''}
                  </Text>
                </Pressable>
                <TextInput
                  value={habit.name}
                  onChangeText={(text) => updateHabit(habit.id, text)}
                  style={styles.habitInput}
                  placeholderTextColor={palette.onSurfaceVariant}
                />
                <Pressable onPress={() => archiveHabit(habit.id)} accessibilityRole="button" style={styles.textButton}>
                  <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Delete</Text>
                </Pressable>
              </View>
            );
          })}

          {habits.length === 0 && (
            <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>Pick something small. Three is enough.</Text>
          )}
        </Card>
      </View>

      <View style={styles.spaced}>
        <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Today at a glance</Text>
        <Card variant="recessed" style={styles.lockedRow}>
          <Icon name="sparkles" size={20} color={palette.onSurfaceVariant} />
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, flex: 1, marginLeft: spacing.sm }]}>
            {syncQueue.length > 0
              ? `${syncQueue.length} local update${syncQueue.length === 1 ? '' : 's'} waiting to sync.`
              : 'Your local rhythm is up to date.'}
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
                <Text style={[type.titleMd, { color: palette.onSurfaceVariant }]}>{artist.name.charAt(0)}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      <Text
        style={[type.labelSm, { color: palette.onSurfaceVariant, marginTop: spacing.xs, textAlign: 'center' }]}
        numberOfLines={1}
      >
        {artists.map((a) => a.name).join(' / ')}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1,
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallButton: {
    minWidth: 64,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.md,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  checkActive: { backgroundColor: palette.primary },
  habitInput: { flex: 1, color: palette.onSurface, paddingVertical: spacing.sm },
  textButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  recapCenter: { alignItems: 'center' },
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
  artistRow: { marginTop: spacing.md, alignItems: 'center' },
  artistAvatars: { flexDirection: 'row', gap: spacing.sm },
  artistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: palette.surfaceContainerHigh,
  },
  artistImage: { width: 44, height: 44, borderRadius: 22 },
  artistImageFallback: { alignItems: 'center', justifyContent: 'center' },
});
