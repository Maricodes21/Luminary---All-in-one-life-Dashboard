import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { ChoiceGroup } from '@/components/ui';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { QuickActionTile } from '@/components/ui/QuickActionTile';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { scheduleEveningReminder } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductionStore, type ProfileSettings } from '@/stores/useProductionStore';

const tones: ProfileSettings['toneProfile'][] = ['gentle', 'direct', 'coach', 'minimal'];
const hours = [18, 19, 20, 21, 22, 23];
const minutes = [0, 15, 30, 45];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const spotify = useSpotifyAuth();
  const session = useAuthStore((s) => s.session);
  const authDisplayName = useAuthStore((s) => s.displayName);
  const setDisplayName = useAuthStore((s) => s.setDisplayName);
  const profileSettings = useProductionStore((s) => s.profileSettings);
  const updateProfileSettings = useProductionStore((s) => s.updateProfileSettings);
  const syncQueue = useProductionStore((s) => s.syncQueue);
  const [displayName, setDisplayNameInput] = useState(authDisplayName ?? profileSettings.displayName);
  const [toneProfile, setToneProfile] = useState(profileSettings.toneProfile);
  const [reminderHour, setReminderHour] = useState(profileSettings.reminderHour);
  const [reminderMinute, setReminderMinute] = useState(profileSettings.reminderMinute);
  const [privacyMode, setPrivacyMode] = useState(profileSettings.privacyMode);
  const [metricUnits, setMetricUnits] = useState(profileSettings.metricUnits);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const cleanName = displayName.trim() || 'Mari';
    setSaving(true);
    setStatus(null);
    updateProfileSettings({ displayName: cleanName, toneProfile, reminderHour, reminderMinute, privacyMode, metricUnits });
    setDisplayName(cleanName);

    try {
      await scheduleEveningReminder(reminderHour, reminderMinute);
      if (session?.user.id) {
        const { error } = await supabase.from('profiles').upsert({
          user_id: session.user.id,
          display_name: cleanName,
          tone_profile: toProfileTone(toneProfile),
          reminder_hour: reminderHour,
          reminder_minute: reminderMinute,
          privacy_mode: privacyMode,
          metric_units: metricUnits,
        });
        if (error) throw new Error(error.message);
      }
      setStatus('Settings saved. Your evening reminder has been refreshed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Settings were saved locally, but sync failed.';
      setStatus(`Saved locally. Sync note: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await spotify.disconnect();
    await supabase.auth.signOut();
    router.replace('/onboarding/welcome');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Close settings">
          <Icon name="close" size={18} color={palette.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <SectionLabel>Profile</SectionLabel>
          <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>Settings</Text>
        </View>
      </View>

      <Card>
        <SectionLabel>Identity</SectionLabel>
        <TextInput
          value={displayName}
          onChangeText={setDisplayNameInput}
          placeholder="Display name"
          placeholderTextColor={palette.onSurfaceVariant}
          style={styles.input}
        />
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.sm }]}>
          This name appears in your morning brief and ritual flow.
        </Text>
      </Card>

      <Card>
        <ChoiceGroup
          label="Tone"
          value={toneProfile}
          options={tones.map((tone) => ({ value: tone, label: tone }))}
          onChange={setToneProfile}
        />
      </Card>

      <Card>
        <SectionLabel>Evening reminder</SectionLabel>
        <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
          {formatTime(reminderHour, reminderMinute)}
        </Text>
        <View style={styles.reminderFields}>
          <ChoiceGroup
            label="Hour"
            value={reminderHour}
            options={hours.map((hour) => ({ value: hour, label: `${hour}:00` }))}
            onChange={setReminderHour}
          />
          <ChoiceGroup
            label="Minutes"
            value={reminderMinute}
            options={minutes.map((minute) => ({ value: minute, label: `:${String(minute).padStart(2, '0')}` }))}
            onChange={setReminderMinute}
          />
        </View>
      </Card>

      <Card>
        <SectionLabel>Privacy and units</SectionLabel>
        <ToggleRow label="Privacy-first mode" detail="Prefer local storage and explicit sync moments." value={privacyMode} onValueChange={setPrivacyMode} />
        <ToggleRow label="Metric units" detail="Use kilograms, centimeters, and kilometers." value={metricUnits} onValueChange={setMetricUnits} />
      </Card>

      <View style={styles.actionGrid}>
        <QuickActionTile
          icon="sparkles"
          label="Spotify"
          detail={spotify.isConnected ? 'Connected for listening recaps' : 'Connect music for mood signals'}
          status={spotify.isConnected ? 'Tap to disconnect' : 'Tap to connect'}
          onPress={spotify.isConnected ? spotify.disconnect : spotify.connect}
        />
        <QuickActionTile
          icon="health"
          label="Health Connect"
          detail="Manage steps, sleep, heart rate, and workouts"
          status="Open health"
          onPress={() => router.push('/(tabs)/health')}
        />
        <QuickActionTile
          icon="clock"
          label="Sync queue"
          detail={syncQueue.length > 0 ? `${syncQueue.length} local update${syncQueue.length === 1 ? '' : 's'} waiting` : 'Everything local is current'}
          status="Local-first"
          onPress={onSave}
        />
      </View>

      {spotify.error ? <Text style={[type.bodySm, { color: palette.error }]}>{spotify.error}</Text> : null}
      {status ? <Text style={[type.bodySm, { color: palette.primary }]}>{status}</Text> : null}

      <Pressable onPress={onSave} disabled={saving} style={[styles.primaryButton, saving && { opacity: 0.72 }]}>
        {saving ? <ActivityIndicator color={palette.onPrimary} /> : <Text style={[type.labelMd, { color: palette.onPrimary }]}>Save settings</Text>}
      </Pressable>

      <Pressable onPress={onSignOut} style={styles.secondaryButton}>
        <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  detail,
  value,
  onValueChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[type.labelMd, { color: palette.onSurface }]}>{label}</Text>
        <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: palette.surfaceContainerHighest, true: `${palette.primary}80` }}
        thumbColor={value ? palette.primary : palette.onSurfaceVariant}
      />
    </View>
  );
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function toProfileTone(tone: ProfileSettings['toneProfile']) {
  if (tone === 'coach' || tone === 'direct') return 'coach_hard';
  if (tone === 'minimal') return 'just_data';
  return 'gentle_nudges';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  input: {
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHighest,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  reminderFields: { gap: spacing.md, marginTop: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  secondaryButton: {
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
