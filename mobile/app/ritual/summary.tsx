import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { moodCopy } from '@/lib/mood';
import { requestCompactNightlyReflection, compactAiConfigured } from '@/lib/ai/localGateway';
import type { PersonalizationContext } from '@/lib/personalization';
import { persistReflection, removePersistedReflection } from '@/lib/personalizationPersistence';
import { localDateKey } from '@/lib/meals/dates';
import { useRitualStore } from '@/stores/useRitualStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore } from '@/stores/useProductionStore';
import { activeMealsUser, useMealsStore } from '@/stores/useMealsStore';
import { usePersonalizationStore } from '@/stores/usePersonalizationStore';
import { scheduleEveningReminder } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { writeDailyRitualSession } from '@/lib/ritual';

export default function RitualSummary() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mood = useRitualStore((state) => state.mood);
  const recap = useRitualStore((state) => state.recap);
  const habitsCompleted = useRitualStore((state) => state.habitsCompleted);
  const totalHabits = useRitualStore((state) => state.totalHabits);
  const session = useRitualStore((state) => state.session);
  const listeningReaction = useRitualStore((state) => state.listeningReaction);
  const userId = useAuthStore((state) => state.user?.id);
  const profileSettings = useProductionStore((state) => state.profileSettings);
  const journalEntries = useProductionStore((state) => state.journalEntries);
  const workoutLogs = useProductionStore((state) => state.workoutLogs);
  const addJournalEntry = useProductionStore((state) => state.addJournalEntry);
  const mealsUser = useMealsStore(activeMealsUser);
  const reflection = usePersonalizationStore((state) =>
    state.reflections.find((item) => item.localDate === session.localDate),
  );
  const saveReflection = usePersonalizationStore((state) => state.saveReflection);
  const acceptReflection = usePersonalizationStore((state) => state.acceptReflection);
  const rejectReflection = usePersonalizationStore((state) => state.rejectReflection);
  const [generating, setGenerating] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);
  const moodDisplay = mood ? moodCopy[mood.label].display : 'Day held gently';

  async function handleClose() {
    try {
      let hour = 21;
      let minute = 0;
      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('reminder_hour, reminder_minute')
          .eq('user_id', userId)
          .single();
        if (data) {
          hour = (data.reminder_hour as number) ?? hour;
          minute = (data.reminder_minute as number) ?? minute;
        }
      }
      await scheduleEveningReminder(hour, minute);
    } catch (error) {
      console.warn('[summary] failed to schedule reminder', error);
    }
    await writeDailyRitualSession(useRitualStore.getState().session);
    router.replace('/(tabs)');
  }

  async function generateReflection() {
    if (!profileSettings.aiPersonalization) {
      Alert.alert(
        'Turn on optional AI reflection?',
        'Choose exactly which Luminary context may be used in Settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => router.push('/settings') },
        ],
      );
      return;
    }
    setGenerating(true);
    setReflectionError(null);
    const localDate = session.localDate;
    const sameDayEntries = journalEntries.filter(
      (entry) => !entry.deletedAt && localDateKey(new Date(entry.writtenAt)) === localDate,
    );
    const context: PersonalizationContext = {
      localDate,
      localHour: new Date().getHours(),
      ...(listeningReaction ? { listeningReaction } : {}),
      confirmedMoodHistory: mood ? [{ label: mood.label, at: new Date().toISOString() }] : [],
      journal: {
        tags: sameDayEntries.flatMap((entry) => entry.tags).slice(0, 12),
        entryCount: sameDayEntries.length,
        ...(profileSettings.aiJournalText
          ? { recentText: sameDayEntries.slice(0, 3).map((entry) => entry.body.slice(0, 1200)) }
          : {}),
      },
      commitments: { completed: habitsCompleted.length, scheduled: totalHabits },
      movement: {
        workoutCompleted: workoutLogs.some((workout) => workout.workoutDate === localDate),
        sessionTitle: workoutLogs.find((workout) => workout.workoutDate === localDate)?.title,
      },
      meals: {
        loggedMealCount:
          mealsUser?.meals.filter((meal) => meal.localDate === localDate).length ?? 0,
      },
      ritual: { recentCompletionRate: 1 },
    };
    const generated = await requestCompactNightlyReflection(context);
    if (generated) {
      saveReflection(generated);
      void persistReflection(generated);
    } else
      setReflectionError(
        compactAiConfigured()
          ? 'Compact AI could not finish this reflection. Nothing was saved; try again when the model is available.'
          : 'Compact AI is not connected on this build. Add the local Luminary AI address to enable reflections.',
      );
    setGenerating(false);
  }

  function keepReflection() {
    if (!reflection || reflection.status === 'accepted') return;
    acceptReflection(reflection.id);
    void persistReflection({ ...reflection, status: 'accepted' });
    const alreadySaved = journalEntries.some(
      (entry) =>
        entry.title === `Nightly reflection · ${reflection.theme}` &&
        localDateKey(new Date(entry.writtenAt)) === reflection.localDate,
    );
    if (!alreadySaved) {
      addJournalEntry(
        `${reflection.reflection}\n\n${reflection.question}`,
        `Nightly reflection · ${reflection.theme}`,
        ['nightly reflection', ...(mood ? [mood.label] : [])],
      );
    }
  }

  function discardReflection() {
    if (!reflection) return;
    rejectReflection(reflection.id);
    void removePersistedReflection(reflection);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Return home"
        >
          <Icon name="back" size={spacing.lg} color={palette.onSurface} />
        </Pressable>
        <View style={styles.headingCopy}>
          <Text style={[type.labelSm, styles.accent]}>Tonight · done</Text>
          <Text style={[type.displaySm, styles.title]}>That’s the day.</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.listeningHalo} pointerEvents="none">
          <View style={styles.haloRing}>
            <Icon name="headphones" size={54} color={palette.primary} />
          </View>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[type.labelSm, styles.accent]}>Tonight · saved</Text>
          <Text style={[type.displaySm, styles.title]}>
            {mood ? `${moodDisplay}, then steadier.` : `${moodDisplay}.`}
          </Text>
          {recap?.topArtists.length ? (
            <Text style={[type.labelSm, styles.copy]} numberOfLines={1}>
              {recap.topArtists
                .slice(0, 3)
                .map((artist) => artist.name)
                .join(' · ')}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric value={`${habitsCompleted.length}/${totalHabits}`} label="Commitments" />
        <Metric value={`${session.summary?.movementMinutes ?? 0}m`} label="Movement" />
        <Metric
          value={`${session.summary?.musicMinutes ?? recap?.minutesListened ?? 0}m`}
          label="Music"
        />
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/journal')}
        style={({ pressed }) => [styles.journalRow, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={[type.labelSm, styles.accent]}>
          {session.journalAdded ? 'Journal saved tonight' : 'Journal skipped tonight'}
        </Text>
        <Text style={[type.labelSm, styles.accent]}>Open Journal →</Text>
      </Pressable>

      {reflection ? (
        <Card variant="featured" style={styles.reflectionCard}>
          <SectionLabel>
            {reflection.status === 'accepted' ? 'Saved to Journal' : 'Optional AI reflection'}
          </SectionLabel>
          <Text style={[type.headlineMd, styles.title]}>{reflection.theme}</Text>
          <Text style={[type.bodyMd, styles.title]}>{reflection.reflection}</Text>
          <Text style={[type.titleMd, styles.accent]}>{reflection.question}</Text>
          <Text style={[type.labelSm, styles.copy]}>
            {reflection.evidenceCategories.join(' · ')} · {Math.round(reflection.confidence * 100)}%
            confidence
          </Text>
          {reflection.status === 'pending' ? (
            <View style={styles.reflectionActions}>
              <Pressable onPress={discardReflection} style={styles.smallButton}>
                <Text style={[type.labelMd, styles.copy]}>Not useful</Text>
              </Pressable>
              <Pressable onPress={keepReflection} style={styles.keepButton}>
                <Text style={[type.labelMd, styles.primaryText]}>Keep in Journal</Text>
              </Pressable>
            </View>
          ) : null}
        </Card>
      ) : null}
      {reflectionError ? <Text style={[type.bodySm, styles.error]}>{reflectionError}</Text> : null}

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => void generateReflection()}
          disabled={generating}
          style={({ pressed }) => [
            styles.secondaryButton,
            (pressed || generating) && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          {generating ? (
            <ActivityIndicator color={palette.primary} />
          ) : (
            <Text style={[type.labelMd, styles.title]}>
              {reflection ? 'Refresh reflection' : 'Optional AI reflection'}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={[type.labelMd, styles.primaryText]}>Close tonight</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[type.headlineLg, styles.title]}>{value}</Text>
      <Text style={[type.labelSm, styles.accent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.sm },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: spacing['2xl'],
    height: spacing['2xl'],
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerLow,
  },
  headingCopy: { flex: 1, gap: spacing.xs },
  hero: {
    minHeight: 270,
    justifyContent: 'flex-end',
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceContainerHigh,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -spacing['3xl'],
    left: spacing['3xl'],
    width: 144,
    height: 144,
    borderRadius: radii.pill,
    backgroundColor: palette.primaryContainer,
    opacity: 0.06,
  },
  listeningHalo: { position: 'absolute', top: spacing.lg, left: 0, right: 0, alignItems: 'center' },
  haloRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHighest,
  },
  heroCopy: { gap: spacing.sm },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: {
    flex: 1,
    minHeight: 80,
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerLow,
  },
  journalRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
  },
  reflectionCard: { gap: spacing.sm },
  reflectionActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  smallButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHighest,
  },
  keepButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: palette.primary,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerLow,
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: palette.primary,
  },
  title: { color: palette.onSurface },
  copy: { color: palette.onSurfaceVariant },
  accent: { color: palette.primary },
  error: { color: palette.error },
  primaryText: { color: palette.onPrimary },
  pressed: { opacity: 0.74 },
});
