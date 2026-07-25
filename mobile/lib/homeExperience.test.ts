import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const mobileRoot = path.resolve(__dirname, '..');

test('home Spotify recap matches the Luminary editorial card and keeps four tracks and artists', () => {
  const source = fs.readFileSync(
    path.join(mobileRoot, 'components/spotify/SpotifyDailyRecap.tsx'),
    'utf8',
  );

  assert.match(source, /LuminaryHomeRecap/);
  assert.match(source, /Listening today/);
  assert.match(source, /Tonight’s read/);
  assert.match(source, /topTracks\.slice\(0, 4\)/);
  assert.match(source, /topArtists\.slice\(0, 4\)/);
  assert.match(source, /tracks\.map\(\(track\) => track\.name\)\.join\(' · '\)/);
  assert.match(source, /artists\.map\(\(artist\) => artist\.name\)\.join\(' · '\)/);
  assert.match(source, /See tonight’s recap/);
  assert.doesNotMatch(source, /compactTrackGrid|compactArtistRow|compactCenteredText/);
});

test('home swaps the ritual invitation for music only after explicit completion', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/index.tsx'), 'utf8');
  assert.match(source, /isRitualCompletedForDate\(ritualSession, today\)/);
  assert.match(source, /ritualComplete \? \(/);
  assert.match(source, /<SpotifyHomeCard/);
  assert.match(source, /<TonightCard/);
  assert.match(source, /Good day,/);
  assert.match(source, /Open profile and settings/);
  assert.match(source, /<CommitmentsCard/);
  assert.match(source, /Today at a glance/);
  assert.match(source, /homeHabits = habits\.slice\(0, 3\)/);
  assert.match(source, /completedHome = homeHabits\.filter/);
  assert.match(source, /confirmedMood=\{ritualSession\.mood\}/);
  assert.match(source, /moodSkipped=\{ritualSession\.moodSkipped\}/);
  assert.match(source, /onOpenSummary=\{\(\) => router\.push\('\/ritual\/summary'\)\}/);
  assert.doesNotMatch(source, /ritualDoneToday = habits/);
});

test('home music empty state owns Spotify connection and refresh actions', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/index.tsx'), 'utf8');

  assert.match(source, /onConnect=\{spotify\.connect\}/);
  assert.match(source, /onRefresh=\{\(\) => refetchRecap\(\)\}/);
  assert.match(source, /Connect Spotify/);
  assert.match(source, /Refresh listening/);
});

test('home routes Spotify auth and recap failures into a recoverable music card', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/index.tsx'), 'utf8');

  assert.match(source, /error:\s*recapError/);
  assert.match(source, /error=\{spotify\.error \?\? recapError\?\.message \?\? null\}/);
  assert.match(source, /error:\s*string \| null/);
  assert.match(source, /\{error \?\?/);
  assert.match(source, /onPress=\{connected \? onRefresh : onConnect\}/);
});

test('nightly ritual explains music, clarifies decisions, and persists explicit completion', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/ritual/index.tsx'), 'utf8');
  const summary = fs.readFileSync(path.join(mobileRoot, 'app/ritual/summary.tsx'), 'utf8');

  assert.match(source, /Why this came up/);
  assert.match(source, /Yes, this feels right/);
  assert.match(source, /Choose a different mood/);
  assert.match(source, /Skip mood tonight/);
  assert.match(source, /setStage\('journal'\)/);
  assert.match(source, /completeSession\(\{/);
  assert.match(source, /<AlbumStack/);
  assert.match(source, /styles\.evidenceStrip/);
  assert.doesNotMatch(source, /<RecapCard/);
  assert.match(source, /writeDailyRitualSession/);
  assert.doesNotMatch(summary, /reset\(\)/);
});

test('commitments hub keeps one add path and uses pause and edit language', () => {
  const hub = fs.readFileSync(path.join(mobileRoot, 'app/habits/index.tsx'), 'utf8');
  const detail = fs.readFileSync(path.join(mobileRoot, 'app/habits/[id].tsx'), 'utf8');
  const library = fs.readFileSync(path.join(mobileRoot, 'app/habits/library.tsx'), 'utf8');

  assert.match(hub, /Add commitment/);
  assert.match(hub, /'Pause'/);
  assert.doesNotMatch(hub, /Browse library|\bRest\b/);
  assert.match(detail, />Edit</);
  assert.doesNotMatch(detail, /Edit rhythm/);
  assert.match(library, /habitCategories\.map/);
});

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

test('journal keeps a continuous Cadence timeline with finite week and month paging', () => {
  const screen = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/journal.tsx'), 'utf8');

  assert.match(screen, /function PeriodNavigator/);
  assert.match(screen, /getPeriodRange/);
  assert.match(screen, /\['week', 'month'\]/);
  assert.match(screen, /scroll the timeline/);
  assert.doesNotMatch(screen, /function DayBrowser|selectedDay/);
  assert.match(screen, /label="Free write"/);
  assert.match(screen, /Your inner weather\./);
  assert.match(screen, /Open journal patterns/);
  assert.match(screen, /accessibilityLabel={`Older \${mode}`}/);
  assert.match(screen, /accessibilityLabel={`Newer \${mode}`}/);
});

test('journal delete confirmations identify local and synced entries', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/journal.tsx'), 'utf8');

  assert.match(source, /const confirmLocalDelete = \(entry:/);
  assert.match(source, /const confirmRemoteDelete = \(entry:/);
  assert.match(source, /entry\.title\?\.trim\(\) \|\| entry\.body\.trim\(\)\.slice\(0, 80\)/);
  assert.match(source, /confirmLocalDelete\(entry\)/);
  assert.match(source, /confirmRemoteDelete\(entry\)/);
});
