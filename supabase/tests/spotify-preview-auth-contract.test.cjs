const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(
  path.join(root, 'migrations/20260802100000_spotify_preview_oauth.sql'),
  'utf8',
);
const handler = fs.readFileSync(path.join(root, 'functions/spotify-preview-auth/index.ts'), 'utf8');
const config = fs.readFileSync(path.join(root, 'config.toml'), 'utf8');

test('keeps the preview handoff service-only and short-lived', () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all[^;]+from anon, authenticated/i);
  assert.match(migration, /interval '5 minutes'/i);
  assert.match(migration, /consumed_at timestamptz/i);
  assert.match(config, /\[functions\.spotify-preview-auth\][\s\S]*verify_jwt = false/);
});

test('binds start and poll to an authenticated user and consumes codes once', () => {
  assert.match(handler, /authenticate\(request\)/);
  assert.match(handler, /user_id: `eq\.\$\{userId\}`/);
  assert.match(handler, /consumed_at: 'is\.null'/);
  assert.match(handler, /consumed_at: new Date\(\)\.toISOString\(\)/);
  assert.match(handler, /authorization_code: null/);
  assert.doesNotMatch(handler, /SPOTIFY_CLIENT_SECRET/);
  assert.doesNotMatch(handler, /code_verifier/i);
});

test('never renders the Spotify authorization code into the callback page', () => {
  const callbackPage = handler.slice(handler.indexOf('function callbackPage'));
  assert.doesNotMatch(callbackPage, /authorization_code/);
  assert.match(callbackPage, /Content-Security-Policy/);
  assert.match(callbackPage, /Cache-Control': 'no-store'/);
});
