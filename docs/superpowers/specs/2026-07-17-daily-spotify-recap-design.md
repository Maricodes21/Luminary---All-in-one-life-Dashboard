# Daily Spotify Recap Design

## Goal

Turn Spotify recap into a coherent view of the current local calendar day: top three songs with repeat counts, top three artists, minutes played, artists played, and tracks played.

## Product behavior

- Derive every displayed ranking and statistic from recently played tracks for the same local day. Do not mix daily songs with Spotify's four-week top-artist ranking.
- Sum the returned track durations for minutes played, count playback events for tracks played, and count distinct primary artists for artists played.
- Keep the Spotify-derived mood signal and confirmation flow, but present it outside the recap card so the recap itself stays focused on listening.
- Preserve connected, empty, loading, retry, and offline snapshot behavior.

## Visual direction

- Translate the reference's editorial hierarchy into Luminary's existing dark, tonal, no-line design system.
- The ritual card uses prominent top-artist portraits, three album-art repeat tiles, and three statistic tiles.
- The Home card stays compact with three repeat rows, a small top-artist strip, and one inline stats row.
- Use only design-system tokens and the single primary blue accent. Spotify artwork and artist imagery remain uncropped beyond normal aspect-fill presentation and link back to Spotify when a URL is available.

## Data and failure handling

- Page backward through recently played history until the target local day is complete, with a finite safety cap.
- Validate page, track, and artist responses with Zod.
- If artist enrichment fails, retain the daily ranking and use representative album art or an initial as the visual fallback.
- Return `null` only when no plays exist for the target day.

## Acceptance criteria

- Repeated songs rank first and show their playback count.
- All three daily stats and both top-three lists agree with the same play set.
- Home contains the requested information without becoming a hero-sized card.
- Mood confirmation, Spotify reconnect behavior, and ritual snapshot writes still work.

