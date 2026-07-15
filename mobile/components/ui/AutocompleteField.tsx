import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { suggestFromHistory } from '@/lib/forms/assistedInputs';

export type AutocompleteFieldProps = { label?: string; value: string; onChangeText: (value: string) => void; suggestions: readonly string[]; onSelect?: (value: string) => void; placeholder?: string; multiline?: boolean };

export function AutocompleteField({ label, value, onChangeText, suggestions, onSelect, placeholder, multiline = false }: AutocompleteFieldProps) {
  const matches = suggestFromHistory(value, [...suggestions], 5).filter((suggestion) => suggestion.toLowerCase() !== value.trim().toLowerCase());

  const select = (suggestion: string) => {
    onChangeText(suggestion);
    onSelect?.(suggestion);
  };

  return (
    <View style={styles.root}>
      {label ? <Text style={[type.labelSm, styles.label]}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.onSurfaceVariant}
        multiline={multiline}
        style={[type.bodyMd, styles.input, multiline && styles.multiline]}
        accessibilityLabel={label ?? placeholder ?? 'Search suggestions'}
      />
      {matches.length ? (
        <View style={styles.suggestions} accessibilityRole="list" accessibilityLabel={`${label ?? 'Input'} suggestions`}>
          {matches.map((suggestion) => (
            <Pressable key={suggestion.toLowerCase()} onPress={() => select(suggestion)} style={styles.suggestion} accessibilityRole="button" accessibilityLabel={suggestion}>
              <Text style={[type.bodySm, styles.suggestionText]}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: { color: palette.onSurfaceVariant },
  input: { minHeight: 48, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: palette.outlineVariant, borderRadius: radii.sm, color: palette.onSurface, backgroundColor: palette.surfaceContainerLow },
  multiline: { minHeight: 108, paddingTop: spacing.md, textAlignVertical: 'top' },
  suggestions: { overflow: 'hidden', borderWidth: 1, borderColor: palette.outlineVariant, borderRadius: radii.sm, backgroundColor: palette.surfaceContainerLow },
  suggestion: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md },
  suggestionText: { color: palette.onSurface },
});
