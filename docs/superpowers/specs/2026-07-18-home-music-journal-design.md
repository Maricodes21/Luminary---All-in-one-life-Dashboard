# Home Music And Journal Refinement

## Objective

Make the home screen faster to scan by giving music a compact, centered recap, removing redundant integration prompts, and moving the nightly ritual and habits higher. Repair the journal timeline so entries have consistent spacing and both local and synced entries can be permanently deleted after confirmation.

## Home Structure

The home screen content order will be:

1. Greeting and profile control
2. Music recap or Spotify connection prompt
3. Nightly ritual, when it is still relevant
4. Today at a glance
5. Daily habits

The separate Spotify and Health Connect connection tiles will be removed. Health setup remains available from the Health screen. The Today's Focus card will be removed for now.

## Compact Music Card

`SpotifyDailyRecap` remains the shared presentation component for both Home and Nightly Recap. Its home variant will use a compact grid instead of a vertical track list:

- Center the card heading and section labels.
- Show up to three tracks in one row with square album artwork, a two-line track/artist label, and a small play-count indicator.
- Show up to three artists in one centered row with circular artwork and centered names.
- Keep the three listening statistics in one restrained row.
- Use stable equal-width columns so long labels truncate without shifting card dimensions.
- Keep the full editorial variant used by Nightly Recap unchanged.

The compact card should reveal useful listening information without dominating the first viewport. Artwork and labels may shrink on compact phones, but tracks and artists remain side by side.

## Spotify Empty State

When Spotify is disconnected, the music card itself becomes the connection prompt. It contains a centered music icon, short supporting copy, and one Connect Spotify button. When Spotify is connected but no listening history is available, the same card explains that today's listening will appear there and offers a refresh action. No separate connection tile is shown.

## Nightly Ritual And Habits

The existing nightly ritual card moves into the space previously occupied by Today's Focus. Its completion logic remains unchanged: when the ritual is no longer relevant, it may be omitted and Today at a Glance moves up naturally. Today at a Glance follows the ritual, and Daily Habits follows the glance section with its existing controls unchanged.

## Journal Timeline

The timeline will use one entry-list container with a consistent vertical gap. The New Entry composer, local entries, synced entries, loading state, and empty state must never sit flush against one another.

Local and synced entries will share the same visible delete affordance. Deletion behavior is:

- Ask for confirmation naming the entry context before deleting.
- Local entries use the existing soft-delete and offline sync queue.
- Synced entries issue an authenticated Supabase delete scoped to the entry ID.
- On successful remote deletion, invalidate the journal query so the card disappears.
- On failure, leave the entry visible and show a recoverable error message.
- Deletion is permanent after confirmation; there is no Undo window.

Supabase row-level security remains the authority preventing deletion of another user's entry.

## Component Boundaries

- `SpotifyDailyRecap`: owns full and compact recap layouts.
- Home screen: owns content ordering and Spotify connection/empty-state actions.
- `EntryCard`: owns the shared synced-entry presentation and optional delete action.
- `useJournalEntries`: owns journal retrieval and authenticated remote deletion mutation.
- Production store: continues to own local journal entries and queued local deletion.

## Error Handling

- Missing Spotify artwork uses the existing initial fallback without resizing the grid.
- A Spotify connection or refresh failure remains inside the music card and does not block the rest of Home.
- A failed synced-entry deletion preserves the card and displays an alert.
- Repeated delete presses are disabled while a remote deletion is pending.

## Verification

- Add source-level regression tests for the compact three-column track layout, centered headings, and removal of connection and focus cards.
- Test the disconnected Spotify card exposes its connection action.
- Test the journal timeline uses one consistent gap and both local and synced cards expose deletion.
- Test remote deletion success invalidates `journal_entries`; failure preserves the entry and surfaces an error.
- Run content tests, type checking, lint, and `git diff --check`.
- Verify Android at compact and standard emulator sizes for card height, text truncation, spacing, scrolling, and overlap.
- Manually verify local and synced journal deletion confirmations and the post-delete timeline.

## Scope

This iteration does not redesign the Health screen, change Spotify data collection, add journal undo, or change the habit and ritual workflows beyond their home-screen position.
