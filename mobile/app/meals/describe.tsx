import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { MealScreen } from '@/components/meals/MealScreen';
import { parseMealDescription } from '@/lib/meals/descriptionParser';

export default function DescribeMealScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const parts = parseMealDescription(description);
  return <MealScreen title="Describe your meal" subtitle="Luminary will separate it into editable parts">
    <TextInput value={description} onChangeText={setDescription} multiline autoFocus textAlignVertical="top" placeholder="150 g chicken, one cup rice, 80 g broccoli" placeholderTextColor={palette.onSurfaceVariant} style={[type.bodyLg, styles.input]} accessibilityLabel="Meal description" />
    <Text style={[type.bodySm, styles.muted]}>Include quantities when you know them. Nothing is logged until you review the ingredients and nutrition.</Text>
    {parts.length ? <View style={styles.preview}><Text style={[type.labelSm, styles.muted]}>UNDERSTOOD AS</Text>{parts.map((part, index) => <Text key={`${part.name}-${index}`} style={[type.bodyMd, styles.title]}>{part.quantity} {part.unit} · {part.name}</Text>)}</View> : null}
    <Pressable disabled={!parts.length} onPress={() => router.push({ pathname: '/meals/manual-parts', params: { draft: JSON.stringify(parts) } })} style={[styles.button, !parts.length && styles.disabled]} accessibilityRole="button"><Text style={[type.labelMd, styles.buttonText]}>Review ingredients</Text></Pressable>
  </MealScreen>;
}

const styles = StyleSheet.create({ input: { minHeight: 150, padding: spacing.md, borderRadius: radii.md, color: palette.onSurface, backgroundColor: palette.surfaceContainer }, muted: { color: palette.onSurfaceVariant }, title: { color: palette.onSurface }, preview: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: palette.surfaceContainerLow }, button: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: palette.primary }, disabled: { opacity: 0.45 }, buttonText: { color: palette.onPrimary } });
