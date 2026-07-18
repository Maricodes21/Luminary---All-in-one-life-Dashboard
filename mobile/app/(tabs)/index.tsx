import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Icon } from '@/components/ui/Icon';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { QuickActionTile } from '@/components/ui/QuickActionTile';
import { Chip } from '@/components/ui/Chip';
import { SpotifyDailyRecap } from '@/components/spotify/SpotifyDailyRecap';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore } from '@/stores/useProductionStore';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';
import { fetchRecap, type SpotifyRecap } from '@/lib/spotify';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { habitCategories, habitSuggestions, type HabitSuggestion } from '@/lib/modulePresets';
import { localDateKey } from '@/lib/meals/dates';
import { getHabitIconName } from '@/lib/habitIcons';

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const displayName = useAuthStore((s) => s.displayName);
  const { data: recap, error: recapError, refetch: refetchRecap, isFetching: recapFetching } = useHomeSpotifyRecap();
  const spotify = useSpotifyAuth();
  const [customHabitName, setCustomHabitName] = useState('');
  const [habitSheetOpen, setHabitSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Morning');
  const today = localDateKey(new Date());
  const habits = useProductionStore((s) =>
    s.habits.filter((habit) => !habit.archivedAt).sort((a, b) => a.position - b.position),
  );
  const mealsUser = useMealsStore(activeMealsUser);
  const workoutPlans = useProductionStore((s) => s.workoutPlans);
  const expenses = useProductionStore((s) => s.expenses);
  const addHabit = useProductionStore((s) => s.addHabit);
  const archiveHabit = useProductionStore((s) => s.archiveHabit);
  const toggleHabitCompletion = useProductionStore((s) => s.toggleHabitCompletion);
  const syncQueue = useProductionStore((s) => s.syncQueue);
  const completedToday = habits.filter((habit) => habit.completedOn.includes(today)).length;
  const todayMeals = mealsUser?.meals.filter((meal) => meal.localDate === today) ?? [];
  const queuedUpdates = syncQueue.length + (mealsUser?.syncQueue.length ?? 0);
  const ritualDoneToday = habits.length > 0 && completedToday === habits.length;
  const todaySpend = expenses
    .filter((expense) => expense.transactionDate === today)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const latestPlan = workoutPlans[0];

  useEffect(() => {
    if (spotify.isConnected) {
      void refetchRecap();
    }
  }, [spotify.isConnected, refetchRecap]);

  const suggestedHabits = useMemo(
    () =>
      habitSuggestions.filter(
        (suggestion) =>
          suggestion.category === selectedCategory &&
          !habits.some((habit) => habit.name.toLowerCase() === suggestion.name.toLowerCase()),
      ),
    [habits, selectedCategory],
  );

  const onAddCustomHabit = () => {
    if (!customHabitName.trim()) return;
    addHabit(customHabitName.trim());
    setCustomHabitName('');
  };

  const onAddSuggestion = (suggestion: HabitSuggestion) => {
    addHabit(suggestion.name);
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>Good morning,</Text>
            <Text style={[type.headlineLg, { color: palette.primary, marginTop: 2 }]}>{displayName ?? 'Mari'}</Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={styles.profileButton} accessibilityRole="button">
            <Icon name="profile" size={20} color={palette.onSurface} />
            <Icon name="settings" size={16} color={palette.primary} />
          </Pressable>
        </View>

        <SpotifyHomeCard
          recap={recap}
          connected={spotify.isConnected}
          loading={recapFetching}
          error={spotify.error ?? recapError?.message ?? null}
          onConnect={spotify.connect}
          onRefresh={() => refetchRecap()}
        />

        {!ritualDoneToday ? (
          <Card variant="featured" style={styles.spaced}>
            <Pressable
              onPress={() => router.push('/ritual')}
              style={styles.ritualCard}
              accessibilityRole="button"
              accessibilityLabel="Begin tonight's ritual"
            >
              <View style={styles.ritualIcon}>
                <Icon name="sparkles" size={22} color={palette.onPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <SectionLabel>Nightly ritual</SectionLabel>
                <Text style={[type.titleMd, { color: palette.onSurface, marginTop: 2 }]}>
                  Close the day while it is still fresh.
                </Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                  {completedToday} of {habits.length} habits checked in today
                </Text>
              </View>
              <Icon name="journal" size={20} color={palette.primary} />
            </Pressable>
          </Card>
        ) : null}

        <View style={styles.spaced}>
          <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Today at a glance</Text>
          <View style={styles.glanceGrid}>
            <QuickActionTile
              icon="meals"
              label="Meals"
              detail={todayMeals.length ? `${todayMeals.length} logged today` : mealsUser?.plans[0]?.entries[0]?.name ?? 'Plan your first plate'}
              accent={palette.secondary}
              onPress={() => router.push('/(tabs)/meals')}
            />
            <QuickActionTile
              icon="health"
              label="Movement"
              detail={latestPlan ? `${latestPlan.category} / ${latestPlan.level}` : 'Create a weekly plan'}
              accent={palette.tertiary}
              onPress={() => router.push('/(tabs)/health')}
            />
            <QuickActionTile
              icon="money"
              label="Spend"
              detail={todaySpend ? `R${todaySpend.toFixed(0)} captured today` : 'No purchases logged'}
              accent={palette.primary}
              onPress={() => router.push('/(tabs)/money')}
            />
            <QuickActionTile
              icon="sparkles"
              label="Sync"
              detail={
                queuedUpdates > 0
                  ? `${queuedUpdates} update${queuedUpdates === 1 ? '' : 's'} waiting`
                  : 'Local rhythm is current'
              }
              accent={palette.primary}
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>

        <View style={styles.spaced}>
          <View style={styles.sectionHeader}>
            <Text style={[type.headlineMd, { color: palette.onSurface }]}>Daily habits</Text>
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
              {completedToday} of {habits.length} completed
            </Text>
          </View>
          <Card>
            {habits.map((habit) => (
              <View key={habit.id} style={styles.habitRow}>
                <Pressable
                  onPress={() => toggleHabitCompletion(habit.id, today)}
                  style={[styles.habitToggle, habit.completedOn.includes(today) && styles.habitToggleDone]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: habit.completedOn.includes(today) }}
                  accessibilityLabel={habit.name}
                >
                  <Icon
                    name={getHabitIconName(habit.name)}
                    size={16}
                    color={habit.completedOn.includes(today) ? palette.onPrimary : palette.onSurfaceVariant}
                  />
                </Pressable>
                <Pressable
                  onPress={() => toggleHabitCompletion(habit.id, today)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: habit.completedOn.includes(today) }}
                  style={styles.habitNameButton}
                >
                  <Text
                    style={[
                      type.bodyMd,
                      { color: habit.completedOn.includes(today) ? palette.onSurfaceVariant : palette.onSurface },
                      habit.completedOn.includes(today) && styles.habitDoneText,
                    ]}
                  >
                    {habit.name}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => archiveHabit(habit.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Archive ${habit.name}`}
                  style={styles.iconButton}
                >
                  <Icon name="close" size={16} color={palette.onSurfaceVariant} />
                </Pressable>
              </View>
            ))}

            <Pressable onPress={() => setHabitSheetOpen(true)} style={styles.addHabitButton} accessibilityRole="button">
              <Icon name="plus" size={18} color={palette.onPrimary} />
              <Text style={[type.labelMd, { color: palette.onPrimary }]}>Add from suggestions</Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>

      <ActionSheet
        visible={habitSheetOpen}
        onClose={() => setHabitSheetOpen(false)}
        eyebrow="Habit library"
        title="Choose something small"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryStrip}>
          {habitCategories.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={category === selectedCategory}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
        {suggestedHabits.map((suggestion) => (
          <SuggestionRow key={suggestion.name} suggestion={suggestion} onAdd={() => onAddSuggestion(suggestion)} />
        ))}
        {suggestedHabits.length === 0 ? (
          <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
            You have already added the easy picks in this category.
          </Text>
        ) : null}
        <Card variant="featured">
          <SectionLabel>Custom habit</SectionLabel>
          <View style={styles.addRow}>
            <TextInput
              value={customHabitName}
              onChangeText={setCustomHabitName}
              placeholder="Name your own small promise"
              placeholderTextColor={palette.onSurfaceVariant}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={onAddCustomHabit}
            />
            <Pressable onPress={onAddCustomHabit} style={styles.smallButton} accessibilityRole="button">
              <Text style={[type.labelMd, { color: palette.onPrimary }]}>Add</Text>
            </Pressable>
          </View>
        </Card>
      </ActionSheet>

    </>
  );
}

function SuggestionRow({ suggestion, onAdd }: { suggestion: HabitSuggestion; onAdd: () => void }) {
  return (
    <View style={styles.suggestionRow}>
      <View style={styles.suggestionIcon}>
        <Icon name={suggestion.icon} size={20} color={palette.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.titleMd, { color: palette.onSurface }]}>{suggestion.name}</Text>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>{suggestion.detail}</Text>
      </View>
      <Pressable onPress={onAdd} style={styles.roundAddButton} accessibilityRole="button">
        <Icon name="plus" size={18} color={palette.onPrimary} />
      </Pressable>
    </View>
  );
}

function SpotifyHomeCard({ recap, connected, loading, error, onConnect, onRefresh }: {
  recap: SpotifyRecap | null | undefined;
  connected: boolean;
  loading: boolean;
  error: string | null;
  onConnect: () => void;
  onRefresh: () => void;
}) {
  if (recap) return <View style={styles.spaced}><SpotifyDailyRecap recap={recap} compact /></View>;

  return (
    <Card variant="recessed" style={styles.spaced}>
      <View style={styles.musicEmptyState}>
        <Icon name="sparkles" size={24} color={palette.primary} />
        <SectionLabel>Listening today</SectionLabel>
        <Text style={[type.titleMd, styles.musicEmptyTitle]}>
          {connected ? 'Your music will meet you here' : 'Bring your listening into Luminary'}
        </Text>
        <Text style={[type.bodySm, styles.musicEmptyCopy]}>
          {error ? error : connected
            ? loading ? 'Checking today\'s listening.' : 'No listening history has arrived for today yet.'
            : 'Connect Spotify to see today\'s tracks, artists, and listening rhythm.'}
        </Text>
        <Pressable onPress={connected ? onRefresh : onConnect} style={styles.musicEmptyButton} accessibilityRole="button">
          <Text style={[type.labelMd, { color: palette.onPrimary }]}>
            {connected ? 'Refresh listening' : 'Connect Spotify'}
          </Text>
        </Pressable>
      </View>
    </Card>
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
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    backgroundColor: palette.surfaceContainer,
  },
  spaced: { marginTop: spacing.sm },
  musicEmptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  musicEmptyTitle: { color: palette.onSurface, textAlign: 'center' },
  musicEmptyCopy: { color: palette.onSurfaceVariant, textAlign: 'center', maxWidth: 300 },
  musicEmptyButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.lg,
  },
  ritualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ritualIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.surfaceContainerHigh,
  },
  habitToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  habitToggleDone: { backgroundColor: palette.primary },
  habitNameButton: { flex: 1, paddingVertical: spacing.xs },
  habitDoneText: { textDecorationLine: 'line-through' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  addHabitButton: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
  },
  glanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  input: {
    flex: 1,
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHighest,
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
  categoryStrip: { gap: spacing.sm, paddingRight: spacing.md },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surfaceContainer,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  roundAddButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
});
