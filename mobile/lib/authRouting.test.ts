import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  resolveProfileRestore,
  routeForAuthState,
  shouldAdvanceSpotifyOnReturn,
} from './authRouting';

test('profile restore does not turn a transient lookup failure into incomplete onboarding', () => {
  assert.equal(
    resolveProfileRestore({ remoteComplete: null, profileError: true, cachedStatus: 'complete' }),
    'complete',
  );
  assert.equal(
    resolveProfileRestore({ remoteComplete: null, profileError: true, cachedStatus: null }),
    'unknown',
  );
  assert.equal(
    resolveProfileRestore({ remoteComplete: false, profileError: false, cachedStatus: 'complete' }),
    'incomplete',
  );
});

test('auth routing waits for profile resolution instead of restarting onboarding', () => {
  assert.equal(
    routeForAuthState({
      hasSession: true,
      onboardingStatus: 'unknown',
      firstSegment: '(tabs)',
      resumeStep: 'spotify',
    }),
    null,
  );
  assert.equal(
    routeForAuthState({
      hasSession: true,
      onboardingStatus: 'complete',
      firstSegment: 'spotify-callback',
      resumeStep: 'spotify',
    }),
    '/(tabs)',
  );
});

test('Spotify app returns resume the persisted onboarding step', () => {
  assert.equal(
    routeForAuthState({
      hasSession: true,
      onboardingStatus: 'incomplete',
      firstSegment: 'spotify-callback',
      resumeStep: 'spotify',
    }),
    '/onboarding/spotify',
  );
  assert.equal(
    routeForAuthState({
      hasSession: true,
      onboardingStatus: 'incomplete',
      firstSegment: 'onboarding',
      resumeStep: 'spotify',
    }),
    null,
  );
});

test('Spotify redirect has a concrete Expo route while OAuth completes', () => {
  assert.equal(fs.existsSync(path.resolve(__dirname, '../app/spotify-callback.tsx')), true);
});

test('Spotify only auto-advances a persisted user-initiated connection', () => {
  assert.equal(shouldAdvanceSpotifyOnReturn(true, true), true);
  assert.equal(shouldAdvanceSpotifyOnReturn(true, false), false);
  assert.equal(shouldAdvanceSpotifyOnReturn(false, true), false);
});

test('account sign-in lets the resolved auth guard choose the destination', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../app/onboarding/account.tsx'), 'utf8');
  const signIn = source.slice(
    source.indexOf('async function signIn()'),
    source.indexOf('return ('),
  );
  assert.doesNotMatch(signIn, /router\.replace\('\/\(tabs\)'\)/);
  assert.match(signIn, /router\.replace\('\/onboarding\/profile'\)/);
});

test('existing-account signup errors direct the user to sign in', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../app/onboarding/account.tsx'), 'utf8');
  assert.match(source, /This email already has an account\. Sign in below\./);
});
