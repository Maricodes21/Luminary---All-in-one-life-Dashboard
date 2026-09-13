# Luminary web installation

Luminary uses the existing Expo Router application for Android, iOS, and web. The web export adds a
manifest, standalone metadata, install icons, and a service worker without creating a separate UI.

## Build and preview

```powershell
npm run web:export
cd mobile
npx expo serve
```

The export is written to `mobile/dist`. Expo's local server uses HTTP, so camera and other secure
browser capabilities may be limited. A deployed test build must use HTTPS.

## Install on a device

- Android with Chrome or Edge: open the HTTPS URL and use **Install Luminary** when the Home screen
  offers it. The browser menu's **Install app** action remains available.
- iPhone or iPad: open the HTTPS URL in Safari, tap **Share**, choose **Add to Home Screen**, enable
  **Open as Web App**, and confirm.
- Desktop Chrome or Edge: use **Install Luminary** in the app or the install icon in the address bar.

The guidance is hidden after installation. If a tester dismisses it, that choice is retained in the
browser under `luminary:pwa-install-dismissed`.

## Hosting

EAS Hosting is the preferred preview path because the project already has an EAS project ID. Build
from `mobile`, then publish `mobile/dist` with `eas deploy`. Configure these public variables in the
selected EAS environment before deployment:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`
- `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI`

Add the final HTTPS origin and Spotify callback URL to the Supabase and Spotify allowlists. Do not
place service-role keys, provider secrets, or private AI credentials in `EXPO_PUBLIC_*` variables.

Any alternative static host must serve `mobile/dist`, use HTTPS, and rewrite application routes to
`index.html`. Keep `/service-worker.js` uncached so releases can replace the app shell promptly.

## Platform boundaries

The installable web app supports Luminary's shared planning, journal, ritual, Spotify, meals, money,
and personalization UI. Native-only integrations still require the Android or iOS build, including
Health Connect or HealthKit, native background notifications, and durable filesystem-backed meal
photo attachments. Web camera access depends on HTTPS and browser permission.
