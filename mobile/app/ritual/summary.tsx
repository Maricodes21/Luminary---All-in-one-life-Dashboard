import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Icon } from '@/components/ui/Icon';
import { moodCopy } from '@/lib/mood';
import { useRitualStore } from '@/stores/useRitualStore';
import { useAuthStore } from '@/stores/useAuthStore';
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
  const userId = useAuthStore((state) => state.user?.id);
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

  function explainAiReflection() {
    Alert.alert(
      'Optional AI reflection',
      'This would use tonight’s saved summary only after you explicitly agree. It is never required to close the ritual.',
      [{ text: 'Not now', style: 'cancel' }],
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Pressable onPress={handleClose} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Return home">
          <Icon name="back" size={spacing.lg} color={palette.onSurface} />
        </Pressable>
        <View style={styles.headingCopy}>
          <Text style={[type.labelSm, styles.accent]}>Tonight · done</Text>
          <Text style={[type.displaySm, styles.title]}>That’s the day.</Text>
          <Text style={[type.bodyMd, styles.copy]}>Music, mood, movement and commitments are now part of one saved recap.</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.heroCopy}>
          <Text style={[type.labelSm, styles.accent]}>Tonight · saved</Text>
          <Text style={[type.displaySm, styles.title]}>{mood ? `${moodDisplay}, then steadier.` : `${moodDisplay}.`}</Text>
          <Text style={[type.bodySm, styles.copy]}>Your music set the starting point. Movement and commitments added context, and tomorrow has one simple cue.</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric value={`${habitsCompleted.length}/${totalHabits}`} label="Commitments" />
        <Metric value={`${session.summary?.movementMinutes ?? 0}m`} label="Movement" />
        <Metric value={`${session.summary?.musicMinutes ?? recap?.minutesListened ?? 0}m`} label="Music" />
      </View>

      <Pressable onPress={() => router.push('/(tabs)/journal')} style={({ pressed }) => [styles.journalRow, pressed && styles.pressed]} accessibilityRole="button">
        <Text style={[type.labelSm, styles.accent]}>{session.journalAdded ? 'Journal saved tonight' : 'Journal skipped tonight'}</Text>
        <Text style={[type.labelSm, styles.accent]}>Open Journal →</Text>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable onPress={explainAiReflection} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={[type.labelMd, styles.title]}>Optional AI reflection</Text>
        </Pressable>
        <Pressable onPress={handleClose} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button">
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
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  backButton: { width: spacing['2xl'], height: spacing['2xl'], borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceContainerLow },
  headingCopy: { flex: 1, gap: spacing.xs },
  hero: { minHeight: 270, justifyContent: 'flex-end', padding: spacing.md, borderRadius: radii.lg, backgroundColor: palette.surfaceContainerHigh, overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -spacing['3xl'], left: spacing['3xl'], width: 144, height: 144, borderRadius: radii.pill, backgroundColor: palette.primaryContainer, opacity: 0.06 },
  heroCopy: { gap: spacing.sm },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, minHeight: 80, justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow },
  journalRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerHigh },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  secondaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow },
  primaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radii.md, backgroundColor: palette.primary },
  title: { color: palette.onSurface },
  copy: { color: palette.onSurfaceVariant },
  accent: { color: palette.primary },
  primaryText: { color: palette.onPrimary },
  pressed: { opacity: 0.74 },
});
