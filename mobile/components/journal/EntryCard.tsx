import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { Card } from '@/components/ui/Card';
import type { JournalEntry } from '@/hooks/useJournalEntries';

export function EntryCard({ entry }: { entry: JournalEntry }) {
  const dateObj = new Date(entry.written_at);
  const dateStr = dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card style={styles.card}>
      <Text style={[type.labelSm, { color: palette.onSurfaceVariant, marginBottom: spacing.xs }]}>
        {dateStr}
      </Text>
      {entry.title ? (
        <Text style={[type.titleLg, { color: palette.onSurface, marginBottom: spacing.xs }]}>
          {entry.title}
        </Text>
      ) : null}
      <Text style={[type.bodyMd, { color: palette.onSurface }]}>
        {entry.body}
      </Text>
      {entry.tags && entry.tags.length > 0 && (
        <View style={styles.tagRow}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: palette.surfaceContainerLowest,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
});
