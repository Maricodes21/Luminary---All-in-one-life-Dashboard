import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radii, spacing, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import type { JournalEntry } from '@/hooks/useJournalEntries';

export function EntryCard({ entry, onDelete, deleting = false }: {
  entry: JournalEntry;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const dateStr = new Date(entry.written_at).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card>
      <View style={styles.entryHeader}>
        <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{dateStr}</Text>
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            disabled={deleting}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel="Delete journal entry"
          >
            <Icon name="trash" size={16} color={palette.error} />
          </Pressable>
        ) : null}
      </View>
      {entry.title ? (
        <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>{entry.title}</Text>
      ) : null}
      <Text style={[type.bodyMd, { color: palette.onSurface, marginTop: spacing.xs }]}>{entry.body}</Text>
      {entry.tags?.length ? (
        <View style={styles.tagRow}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceContainerHigh,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  tag: {
    backgroundColor: palette.surfaceContainerLowest,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
});
