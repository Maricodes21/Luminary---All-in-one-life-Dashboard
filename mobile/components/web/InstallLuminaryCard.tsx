import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Icon } from '@/components/ui/Icon';

const DISMISSED_KEY = 'luminary:pwa-install-dismissed';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type InstallMode = 'prompt' | 'ios-help' | null;

function isStandalone() {
  if (typeof window === 'undefined') return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isAppleMobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function InstallLuminaryCard() {
  const [mode, setMode] = useState<InstallMode>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    if (isStandalone() || window.localStorage.getItem(DISMISSED_KEY) === 'true') return;

    if (isAppleMobileBrowser()) setMode('ios-help');

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setMode('prompt');
    };
    const markInstalled = () => {
      setInstallPrompt(null);
      setMode(null);
      window.localStorage.removeItem(DISMISSED_KEY);
    };

    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  if (Platform.OS !== 'web' || mode === null) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, 'true');
    setMode(null);
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setMode(null);
    setInstallPrompt(null);
  }

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.iconBox}>
        <Icon name="download" size={20} color={palette.onPrimary} />
      </View>
      <View style={styles.copy}>
        <Text style={[type.titleMd, styles.title]}>Keep Luminary close</Text>
        <Text style={[type.bodySm, styles.body]}>
          {mode === 'ios-help'
            ? 'In Safari, tap Share, then Add to Home Screen and Open as Web App.'
            : 'Install this private testing build on your home screen for a focused, app-like experience.'}
        </Text>
        {mode === 'prompt' ? (
          <Pressable
            onPress={() => void install()}
            style={({ pressed }) => [styles.installButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Install Luminary on this device"
          >
            <Text style={[type.labelMd, styles.installText]}>Install Luminary</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={dismiss}
        style={({ pressed }) => [styles.dismissButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Dismiss installation guidance"
      >
        <Icon name="close" size={18} color={palette.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceContainerHigh,
  },
  iconBox: {
    width: spacing['2xl'],
    height: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: palette.primary,
  },
  copy: { flex: 1, gap: spacing.sm },
  title: { color: palette.onSurface },
  body: { color: palette.onSurfaceVariant },
  installButton: {
    minHeight: spacing['2xl'],
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.primary,
  },
  installText: { color: palette.onPrimary },
  dismissButton: {
    width: spacing['2xl'],
    height: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  pressed: { opacity: 0.72 },
});
