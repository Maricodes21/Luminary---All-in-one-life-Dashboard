# Luminary Home and Nightly Ritual Redesign

## Product loop

`Daily activity → Home signals → Commitments → Nightly synthesis → Tomorrow cue`

The redesign keeps the existing five product areas. Home coordinates them without becoming a sixth data source, and the nightly ritual synthesizes them without requiring unfinished module work to be completed.

## Experience structure

### Home

- Retains “Good day, {name}” and the profile/settings entry point.
- Shows the date and a time-aware ritual invitation until an explicit daily ritual session is complete.
- Replaces that invitation with the Spotify recap after completion. The recap ranks four tracks and four artists.
- Keeps commitments in the first viewport with one-tap completion and a direct path to the Commitments Hub.
- Uses a contextual focus card only when there is real unfinished work. The commitments card expands when no focus card is needed.
- Preserves the original semantic Meals, Health, Money, and Journal icons and adds live, non-invented copy for each module.

### Nightly ritual

1. Music proposes a mood and explains the listening evidence behind it.
2. The user can accept it, choose a different mood, or skip mood entirely.
3. Accepted or manually selected moods can flow directly into a Journal entry.
4. Commitments are reconciled against the same state used on Home.
5. Up to three optional cards are selected from genuinely unfinished Meals, Health, and Money work.
6. Tomorrow’s commitments can be kept or intentionally paused.
7. Completion creates an explicit daily ritual session and returns a tomorrow cue to Home.

## Data connections

| UI signal | Source | Rule |
| --- | --- | --- |
| Greeting and profile | Auth profile, local profile fallback | Never blocks Home while profile refreshes |
| Meal prompt | Meals store, local date and current time window | Only prompts for the current expected meal when it is not logged |
| Workout prompt | Workout plans plus local/remote workout logs | Pending only when a plan exists and no workout is logged today |
| Money prompt | Local expenses plus wallet transactions | Asks the user to add a forgotten purchase; never invents an amount |
| Journal state | Local and synced Journal entries | Indicates whether today already has an entry |
| Commitments | One persisted production habit state | Shared by Home, Hub, detail/history, and ritual |
| Listening recap | Spotify recently played data | Four ranked tracks and four ranked artists from the same local day |
| Ritual completion | `DailyRitualSession` | Explicit completion; independent from habit completion |

## Persistence and offline behavior

- The local ritual store persists the active stage, mood decision, Journal draft, habit reconciliation, selected optional signals, and completion summary.
- Supabase stores one `daily_ritual_sessions` row per user and local date with row-level security.
- Failed session, mood, snapshot, habit, and Journal writes enter the existing offline queue and replay on reconnect.
- Reopening an interrupted ritual resumes its last stage. Closing the modal does not erase progress.

## Personalization boundaries

- Rules-first selection is deterministic and inspectable.
- Context cards use only data already produced by the user in the app.
- Every contextual module card is optional.
- Music mood is a suggestion and always exposes accept, change, and skip controls.
- AI-written reflection is not part of this implementation and is not required for completion.

## Database changes

- `daily_ritual_sessions` stores resumable/completed ritual state and summary.
- Habit records gain category, scheduled days, time window, and weekly target fields.
- Intentional day pauses remain separate from archived commitments and do not reset consistency history.
