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

test('home routes Spotify auth and recap failures into a recoverable music card', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/index.tsx'), 'utf8');

  assert.match(source, /error:\s*recapError/);
  assert.match(source, /error=\{spotify\.error \?\? recapError\?\.message \?\? null\}/);
  assert.match(source, /error:\s*string \| null/);
  assert.match(source, /\{error \? error :/);
  assert.match(source, /onPress=\{connected \? onRefresh : onConnect\}/);
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

test('journal delete confirmations identify local and synced entries', () => {
  const source = fs.readFileSync(path.join(mobileRoot, 'app/(tabs)/journal.tsx'), 'utf8');

  assert.match(source, /const confirmLocalDelete = \(entry:/);
  assert.match(source, /const confirmRemoteDelete = \(entry:/);
  assert.match(source, /entry\.title\?\.trim\(\) \|\| entry\.body\.trim\(\)\.slice\(0, 80\)/);
  assert.match(source, /confirmLocalDelete\(entry\)/);
  assert.match(source, /confirmRemoteDelete\(entry\)/);
});
