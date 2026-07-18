# Home Music And Journal Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a compact, centered home music recap, simplify the home hierarchy, and make local and synced journal entries consistently spaced and permanently deletable after confirmation.

**Architecture:** Keep `SpotifyDailyRecap` as the shared visual source, with a compact three-column variant for Home and the existing editorial variant for Nightly Recap. Keep Home responsible for integration states and section ordering. Add a focused journal deletion helper and mutation hook so the screen coordinates confirmation while Supabase access and cache invalidation remain outside the card component.

**Tech Stack:** Expo Router, React Native, TypeScript, TanStack Query, Zustand, Supabase, Node test runner.

## Global Constraints

- Preserve the current uncommitted Spotify recap and authentication work.
- Home order is Music, Nightly Ritual, Today at a Glance, Daily Habits.
- Remove the connection tiles and Today's Focus card.
- Spotify connection prompting belongs inside the music card.
- Health Connect prompting remains on the Health screen.
- Synced journal deletion is permanent after confirmation and has no Undo action.
- Missing artwork must use a stable fallback without changing grid dimensions.
- Do not add dependencies.

---

### Task 1: Compact Shared Spotify Grid

**Files:**
- Modify: `mobile/components/spotify/SpotifyDailyRecap.tsx`
- Create: `mobile/lib/homeExperience.test.ts`
- Modify: `mobile/scripts/run-content-tests.cjs`

**Interfaces:**
- Consumes: `SpotifyRecap` from `mobile/lib/spotify.ts`.
- Produces: unchanged `SpotifyDailyRecap({ recap, compact })` API; `compact` renders equal-width horizontal track and artist grids.

- [ ] **Step 1: Write the failing compact-layout regression test**

Create `mobile/lib/homeExperience.test.ts`:

```ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const mobileRoot = path.resolve(__dirname, '..');

test('compact Spotify recap uses centered three-column tracks and artists', () => {
  const source = fs.readFileSync(
    path.join(mobileRoot, 'components/spotify/SpotifyDailyRecap.tsx'),
    'utf8',
  );

  assert.match(source, /compactTrackGrid/);
  assert.match(source, /compactTrackCard/);
  assert.match(source, /compactSectionHeading/);
  assert.match(source, /compactArtistRow/);
  assert.match(source, /flex:\s*1/);
  assert.doesNotMatch(source, /compactTrackList|compactTrackRow/);
});
```

Append it to `mobile/scripts/run-content-tests.cjs`:

```js
require(path.resolve(__dirname, '../lib/homeExperience.test.ts'));
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:content --workspace=mobile`

Expected: FAIL because `compactTrackGrid`, `compactTrackCard`, and `compactSectionHeading` do not exist and the vertical compact list still exists.

- [ ] **Step 3: Replace the compact vertical list with centered grids**

In `SpotifyDailyRecap.tsx`, keep `EditorialRecap` unchanged. Replace `CompactTracks` with:

```tsx
function CompactTracks({ recap }: { recap: SpotifyRecap }) {
  return (
    <>
      {recap.topTracks.length ? (
        <View style={styles.compactSection}>
          <SectionLabel>On repeat</SectionLabel>
          <View style={styles.compactTrackGrid}>
            {recap.topTracks.map((track) => (
              <SpotifyLink
                key={track.id}
                url={track.spotifyUrl}
                label={`${track.name} by ${track.artistName}`}
                style={styles.compactTrackCard}
              >
                <Artwork
                  imageUrl={track.albumImageUrl}
                  fallback={track.name.charAt(0)}
                  style={styles.compactArtwork}
                  radius={radii.sm}
                />
                <Text style={[type.labelSm, styles.primaryText, styles.compactCenteredText]} numberOfLines={2}>
                  {track.name}
                </Text>
                <Text style={[type.bodySm, styles.mutedText, styles.compactCenteredText]} numberOfLines={1}>
                  {track.artistName}
                </Text>
                <Text style={[type.labelSm, styles.playPillText]}>{formatPlayCount(track.playCount)}</Text>
              </SpotifyLink>
            ))}
          </View>
        </View>
      ) : null}

      {recap.topArtists.length ? (
        <View style={styles.compactSection}>
          <View style={styles.compactSectionHeading}><SectionLabel>Top artists</SectionLabel></View>
          <View style={styles.compactArtistRow}>
            {recap.topArtists.map((artist) => (
              <SpotifyLink key={artist.id} url={artist.spotifyUrl} label={artist.name} style={styles.compactArtist}>
                <Artwork
                  imageUrl={artist.imageUrl}
                  fallback={artist.name.charAt(0)}
                  style={styles.compactArtistImage}
                  radius={radii.pill}
                />
                <Text style={[type.labelSm, styles.primaryText, styles.compactArtistName]} numberOfLines={1}>
                  {artist.name}
                </Text>
              </SpotifyLink>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}
```

Apply compact-only header styles at the component root:

```tsx
<View style={[styles.header, compact && styles.headerCompact]}>
  <View style={compact ? styles.compactHeaderCopy : undefined}>
    <SectionLabel>Listening today</SectionLabel>
    <Text style={[compact ? type.titleLg : type.headlineMd, styles.title, compact && styles.compactCenteredText]}>
      Your day in music
    </Text>
  </View>
  <Text style={[type.labelSm, styles.spotifyAttribution]}>Spotify</Text>
</View>
```

Add stable grid styles:

```ts
headerCompact: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 },
compactHeaderCopy: { alignItems: 'center' },
compactSection: { marginTop: spacing.md, alignItems: 'center', gap: spacing.sm },
compactSectionHeading: { alignItems: 'center' },
compactTrackGrid: { alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm },
compactTrackCard: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 },
compactArtwork: { width: 72, height: 72 },
compactCenteredText: { width: '100%', textAlign: 'center' },
compactArtistRow: { alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm },
compactArtist: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs },
compactArtistImage: { width: 40, height: 40 },
compactArtistName: { width: '100%', textAlign: 'center' },
```

Retain the compact listening-stat row.

- [ ] **Step 4: Run content tests and verify GREEN**

Run: `npm run test:content --workspace=mobile`

Expected: PASS, including the new compact-grid test and existing Spotify recap tests.

- [ ] **Step 5: Commit the compact recap slice**

```bash
git add mobile/components/spotify/SpotifyDailyRecap.tsx mobile/lib/homeExperience.test.ts mobile/scripts/run-content-tests.cjs
git commit -m "feat: compact the home Spotify recap"
```

---

### Task 2: Home Hierarchy And Embedded Spotify Prompt

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx`
- Modify: `mobile/lib/homeExperience.test.ts`

**Interfaces:**
- Consumes: `SpotifyDailyRecap({ recap, compact: true })`, `useSpotifyAuth().connect`, and `refetchRecap()`.
- Produces: Home order Music, Nightly Ritual, Today at a Glance, Daily Habits; `SpotifyHomeCard` owns connected, loading, and disconnected states.

- [ ] **Step 1: Add failing home-order and connection-state tests**

Append to `homeExperience.test.ts`:

```ts
test('home removes redundant prompts and orders glance before habits', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/index.tsx'), 'utf8');
  const music = source.indexOf('<SpotifyHomeCard');
  const ritual = source.indexOf('accessibilityLabel="Begin tonight\'s ritual"');
  const glance = source.indexOf('Today at a glance');
  const habits = source.indexOf('Daily habits');

  assert.ok(music >= 0 && music < ritual);
  assert.ok(ritual < glance && glance < habits);
  assert.doesNotMatch(source, /<ConnectionTile|function ConnectionTile|Today\'s focus/);
});

test('home music empty state owns Spotify connection and refresh actions', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/index.tsx'), 'utf8');

  assert.match(source, /onConnect=\{spotify\.connect\}/);
  assert.match(source, /onRefresh=\{\(\) => refetchRecap\(\)\}/);
  assert.match(source, /Connect Spotify/);
  assert.match(source, /Refresh listening/);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm run test:content --workspace=mobile`

Expected: FAIL because connection tiles and Today's Focus still exist, habits precede the glance section, and `SpotifyHomeCard` does not own connection actions.

- [ ] **Step 3: Implement the embedded music state and new home order**

Change the Home call site to:

```tsx
<SpotifyHomeCard
  recap={recap}
  connected={spotify.isConnected}
  loading={recapFetching}
  onConnect={spotify.connect}
  onRefresh={() => refetchRecap()}
/>
```

Replace `SpotifyHomeCard` with:

```tsx
function SpotifyHomeCard({ recap, connected, loading, onConnect, onRefresh }: {
  recap: SpotifyRecap | null | undefined;
  connected: boolean;
  loading: boolean;
  onConnect: () => void;
  onRefresh: () => void;
}) {
  if (recap) return <View style={styles.spaced}><SpotifyDailyRecap recap={recap} compact /></View>;

  return (
    <Card variant="recessed" style={styles.spaced}>
      <View style={styles.musicEmptyState}>
        <Icon name="sparkles" size={24} color={palette.primary} />
        <SectionLabel>Listening today</SectionLabel>
        <Text style={[type.titleMd, styles.musicEmptyTitle]}>
          {connected ? 'Your music will meet you here' : 'Bring your listening into Luminary'}
        </Text>
        <Text style={[type.bodySm, styles.musicEmptyCopy]}>
          {connected
            ? loading ? 'Checking today\'s listening.' : 'No listening history has arrived for today yet.'
            : 'Connect Spotify to see today\'s tracks, artists, and listening rhythm.'}
        </Text>
        <Pressable onPress={connected ? onRefresh : onConnect} style={styles.musicEmptyButton} accessibilityRole="button">
          <Text style={[type.labelMd, { color: palette.onPrimary }]}>
            {connected ? 'Refresh listening' : 'Connect Spotify'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
```

Remove `ConnectionTile`, `connectionRow`, `connectionTile`, `connectionIcon`, `focusNote`, `getDailyFocusNote`, and calculations used only by Today's Focus. Move the complete Today at a Glance block above the complete Daily Habits block without changing either block's behavior.

Add styles:

```ts
musicEmptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
musicEmptyTitle: { color: palette.onSurface, textAlign: 'center' },
musicEmptyCopy: { color: palette.onSurfaceVariant, textAlign: 'center', maxWidth: 300 },
musicEmptyButton: {
  minHeight: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii.sm,
  backgroundColor: palette.primary,
  paddingHorizontal: spacing.lg,
},
```

- [ ] **Step 4: Run tests and type checking**

Run:

```bash
npm run test:content --workspace=mobile
npm run type-check --workspace=mobile
```

Expected: both commands PASS. The home source contains no redundant integration tiles or focus card.

- [ ] **Step 5: Commit the home hierarchy slice**

```bash
git add "mobile/app/(tabs)/index.tsx" mobile/lib/homeExperience.test.ts
git commit -m "feat: simplify the home daily hierarchy"
```

---

### Task 3: Journal Spacing And Permanent Synced Deletion

**Files:**
- Create: `mobile/lib/journal.ts`
- Create: `mobile/lib/journal.test.ts`
- Modify: `mobile/hooks/useJournalEntries.ts`
- Modify: `mobile/components/journal/EntryCard.tsx`
- Modify: `mobile/app/(tabs)/journal.tsx`
- Modify: `mobile/scripts/run-content-tests.cjs`

**Interfaces:**
- Produces: `deleteJournalRecord(client: JournalDeleteClient, entryId: string): Promise<void>` and `useDeleteJournalEntry()` returning a TanStack mutation.
- `EntryCard` adds optional `onDelete?: () => void` and `deleting?: boolean` props.
- Consumes: existing `deleteJournalEntry(id)` for local entries.

- [ ] **Step 1: Write failing deletion and timeline tests**

Create `mobile/lib/journal.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteJournalRecord, type JournalDeleteClient } from './journal';

test('synced journal deletion scopes the permanent delete to one entry ID', async () => {
  const calls: string[] = [];
  const client: JournalDeleteClient = {
    from: (table) => {
      calls.push(table);
      return {
        delete: () => ({
          eq: async (column, value) => {
            calls.push(`${column}:${value}`);
            return { error: null };
          },
        }),
      };
    },
  };

  await deleteJournalRecord(client, 'entry-1');
  assert.deepEqual(calls, ['journal_entries', 'id:entry-1']);
});

test('synced journal deletion surfaces provider errors', async () => {
  const client: JournalDeleteClient = {
    from: () => ({ delete: () => ({ eq: async () => ({ error: { message: 'denied' } }) }) }),
  };

  await assert.rejects(() => deleteJournalRecord(client, 'entry-1'), /denied/);
});
```

Append source assertions to `homeExperience.test.ts`:

```ts
test('journal timeline spaces every card and exposes local and synced deletion', () => {
  const screen = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/journal.tsx'), 'utf8');
  const card = fs.readFileSync(path.join(mobileRoot, 'components/journal/EntryCard.tsx'), 'utf8');

  assert.match(screen, /timelineStack/);
  assert.match(screen, /gap:\s*spacing\.md/);
  assert.match(screen, /confirmLocalDelete/);
  assert.match(screen, /confirmRemoteDelete/);
  assert.match(card, /onDelete\??:/);
  assert.match(card, /accessibilityLabel="Delete journal entry"/);
});
```

Require `journal.test.ts` from `run-content-tests.cjs`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:content --workspace=mobile`

Expected: FAIL because `mobile/lib/journal.ts`, the mutation, shared delete control, and timeline stack do not exist.

- [ ] **Step 3: Add the tested Supabase deletion boundary**

Create `mobile/lib/journal.ts`:

```ts
export type JournalDeleteClient = {
  from: (table: 'journal_entries') => {
    delete: () => {
      eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function deleteJournalRecord(client: JournalDeleteClient, entryId: string): Promise<void> {
  const { error } = await client.from('journal_entries').delete().eq('id', entryId);
  if (error) throw new Error(error.message);
}
```

In `useJournalEntries.ts`, export a mutation hook:

```ts
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => deleteJournalRecord(supabase, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal_entries'] }),
  });
}
```

Import `useMutation`, `useQueryClient`, and `deleteJournalRecord`. If Supabase's generated type is wider than `JournalDeleteClient`, keep the helper structural and cast only at the call boundary rather than weakening the helper tests.

- [ ] **Step 4: Add shared delete controls and confirmation flows**

Replace `EntryCard.tsx` with the shared synced-entry card below:

```tsx
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
```

In `journal.tsx`, import `Alert` and `useDeleteJournalEntry`, then add:

```ts
const remoteDeletion = useDeleteJournalEntry();

const confirmLocalDelete = (id: string) => Alert.alert(
  'Delete journal entry?',
  'This entry will be permanently removed after your changes sync.',
  [
    { text: 'Keep', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteJournalEntry(id) },
  ],
);

const confirmRemoteDelete = (id: string) => Alert.alert(
  'Delete journal entry?',
  'This permanently removes the entry from your journal.',
  [
    { text: 'Keep', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => void remoteDeletion.mutateAsync(id).catch(() => {
        Alert.alert('Could not delete entry', 'The entry is still here. Please try again.');
      }),
    },
  ],
);
```

Wrap the composer and all timeline states in `<View style={styles.timelineStack}>`, set `timelineStack: { gap: spacing.md }`, remove per-card `marginTop` and `marginBottom`, route local delete buttons through `confirmLocalDelete`, and render synced entries as:

```tsx
<EntryCard
  key={entry.id}
  entry={entry}
  onDelete={() => confirmRemoteDelete(entry.id)}
  deleting={remoteDeletion.isPending && remoteDeletion.variables === entry.id}
/>
```

- [ ] **Step 5: Run journal and full mobile verification**

Run:

```bash
npm run test:content --workspace=mobile
npm run type-check --workspace=mobile
npm run lint --workspace=mobile
git diff --check
```

Expected: all commands PASS. Deletion tests prove ID scoping and provider errors; source tests prove both delete paths and consistent spacing exist.

- [ ] **Step 6: Verify Android behavior**

On the running Android emulator:

1. Confirm the first viewport order is Music, Nightly Ritual, Today at a Glance, then Daily Habits.
2. Confirm three tracks and three artists align in centered rows without clipped labels.
3. Temporarily disconnect Spotify or use the disconnected state and confirm Connect Spotify appears inside the music card.
4. Open Journal and confirm a visible gap between New Entry and the first prior entry.
5. Delete one local test entry after confirmation and verify it disappears.
6. Delete one synced test entry after confirmation and verify the refreshed timeline removes it.
7. Cancel each confirmation once and verify the entry remains.

- [ ] **Step 7: Commit the journal slice**

```bash
git add "mobile/app/(tabs)/journal.tsx" mobile/components/journal/EntryCard.tsx mobile/hooks/useJournalEntries.ts mobile/lib/journal.ts mobile/lib/journal.test.ts mobile/lib/homeExperience.test.ts mobile/scripts/run-content-tests.cjs
git commit -m "fix: align and delete journal entries"
```

---

### Task 4: Final Cross-Screen Review

**Files:**
- No expected source changes; fix only defects found by verification in the owning task's files.

**Interfaces:**
- Consumes all outputs from Tasks 1-3.
- Produces a verified Android build with no dead actions or visual overlap in the changed screens.

- [ ] **Step 1: Run the complete relevant checks**

```bash
npm run test:content --workspace=mobile
npm run test:meals --workspace=mobile
npm run type-check --workspace=mobile
npm run lint --workspace=mobile
npm run deps:check --workspace=mobile
git diff --check
```

Expected: every command PASS with no new warnings attributable to this work.

- [ ] **Step 2: Inspect the final diff boundary**

Run:

```bash
git status --short
git diff --stat
git diff -- "mobile/app/(tabs)/index.tsx" "mobile/app/(tabs)/journal.tsx" mobile/components/spotify/SpotifyDailyRecap.tsx mobile/components/journal/EntryCard.tsx mobile/hooks/useJournalEntries.ts mobile/lib/journal.ts
```

Expected: only the intended Home, Spotify recap, Journal, hook, tests, and plan files are part of this iteration. Existing unrelated Spotify files remain preserved rather than reverted.

- [ ] **Step 3: Capture Android evidence**

Capture one screenshot each of Home and Journal at the standard emulator viewport. Confirm no text overlap, no nested cards, stable artwork dimensions, visible timeline gaps, and tappable delete controls.

- [ ] **Step 4: Commit any verification-only corrections**

If verification required corrections, stage only the owning files and commit:

```bash
git add "mobile/app/(tabs)/index.tsx" "mobile/app/(tabs)/journal.tsx" mobile/components/spotify/SpotifyDailyRecap.tsx mobile/components/journal/EntryCard.tsx mobile/hooks/useJournalEntries.ts mobile/lib/journal.ts mobile/lib/journal.test.ts mobile/lib/homeExperience.test.ts mobile/scripts/run-content-tests.cjs
git commit -m "fix: polish home and journal presentation"
```

If no corrections were required, do not create an empty commit.
