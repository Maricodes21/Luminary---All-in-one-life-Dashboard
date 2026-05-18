import { View, StyleSheet } from 'react-native';
import { spacing } from '@luminary/design-system';
import { Chip } from '@/components/ui/Chip';
import { ALL_MOOD_LABELS, moodCopy } from '@/lib/mood';
import type { MoodLabel } from '@/lib/mood';

type MoodChipGridProps = {
  selected: MoodLabel | null;
  onSelect: (label: MoodLabel) => void;
};

export function MoodChipGrid({ selected, onSelect }: MoodChipGridProps) {
  return (
    <View
      style={styles.grid}
      accessibilityRole="radiogroup"
      accessibilityLabel="Choose your mood"
    >
      {ALL_MOOD_LABELS.map((label) => (
        <Chip
          key={label}
          label={moodCopy[label].display}
          selected={selected === label}
          onPress={() => onSelect(label)}
          style={styles.chip}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    // natural sizing — no forced width
  },
});
