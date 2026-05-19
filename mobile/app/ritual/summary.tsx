import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { moodCopy } from '@/lib/mood';
import { useRitualStore } from '@/stores/useRitualStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { scheduleEveningReminder } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

export default function RitualSummary() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mood = useRitualStore((s) => s.mood);
  const recap = useRitualStore((s) => s.recap);
  const habitsCompleted = useRitualStore((s) => s.habitsCompleted);
  const totalHabits = useRitualStore((s) => s.totalHabits);
  const reset = useRitualStore((s) => s.reset);
  const userId = useAuthStore((s) => s.user?.id);

  const moodDisplay = mood ? moodCopy[mood.label].display : null;
  const moodVerb = mood ? moodCopy[mood.label].verb : null;

  async function handleClose() {
    // Fetch stored reminder time from profile; fall back to 21:00.
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
          hour = (data.reminder_hour as number) ?? 21;
          minute = (data.reminder_minute as number) ?? 0;
        }
      }
      await scheduleEveningReminder(hour, minute);
    } catch (err) {
      console.warn('[summary] failed to schedule reminder', err);
    }
    reset();
    router.dismissAll();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.inner}>
        <SectionLabel>Tonight</SectionLabel>
        <Text style={[type.displayMd, { color: palette.onSurface }]}>The day, distilled.</Text>

        {moodDisplay && (
          <Card>
            <SectionLabel>Mood</SectionLabel>
            <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
              {moodDisplay}
            </Text>
            {moodVerb && (
              <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
                You were {moodVerb} tonight.
              </Text>
            )}
          </Card>
        )}

        {totalHabits > 0 && (
          <Card>
            <SectionLabel>Habits</SectionLabel>
            <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
              {habitsCompleted.length} of {totalHabits} captured
            </Text>
          </Card>
        )}

        {recap && (
          <Card>
            <SectionLabel>Music</SectionLabel>
            <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
              {recap.trackCount} tracks · {recap.minutesListened} min
            </Text>
            {recap.topArtists.length > 0 && (
              <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
                {recap.topArtists.map((a) => a.name).join(', ')}
              </Text>
            )}
          </Card>
        )}

        <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.md }]}>
          See you tomorrow evening.
        </Text>

        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close ritual"
          style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={[type.titleMd, { color: palette.onPrimary }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  doneBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
  },
});
