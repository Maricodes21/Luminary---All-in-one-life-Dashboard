# Luminary on iPhone

This branch supports two iPhone testing paths. Start with Expo Go: it is free, takes a few minutes, and does not require an Apple Developer membership.

## Free preview with Expo Go

### One-time phone setup

1. Install **Expo Go** from the iPhone App Store.
2. Make sure the development computer is online.
3. Keep Expo Go signed in only if you want the project to appear in its recent-project list. An Expo account is not required to scan the live QR code.

### Start Luminary

From the repository root:

```powershell
npm run mobile:preview:iphone
```

The command starts Luminary on the local network and prints a QR code. Keep the iPhone and computer on the same Wi-Fi, open the iPhone Camera app, scan the code, then tap the Expo Go banner. Keep the command running while the phone is testing the app.

If local Wi-Fi blocks device-to-device traffic, try the free tunnel option:

```powershell
npm run mobile:preview:iphone:tunnel
```

The tunnel can also connect devices on different networks, although some corporate or filtered networks block its ngrok connection.

### Preview environment

The app reads its preview services from `mobile/.env`. Required values are documented in `mobile/.env.example`. Never commit `mobile/.env`.

The free Expo Go preview supports the application UI, local-first data, Supabase email/password access, Spotify listening recaps, Journal, Meals, Money, habits, the nightly ritual, camera capture, guided workouts, and local reminders.

Spotify uses a short-lived HTTPS handoff so the provider can return safely while Luminary is running inside Expo Go. The authorization code can be read once by the signed-in user; Spotify tokens and the PKCE verifier stay on the phone.

### One-time Spotify preview setup

Deploy the database migration and callback function from the repository root:

```powershell
npx supabase db push
npx supabase functions deploy spotify-preview-auth --no-verify-jwt
```

In the Spotify Developer Dashboard, add this exact redirect URI, replacing `your-project` with the project reference from `EXPO_PUBLIC_SUPABASE_URL`:

```text
https://your-project.supabase.co/functions/v1/spotify-preview-auth/callback
```

Keep the existing `luminary://spotify-callback` entry too; installable native builds still use it. The preview bridge does not use or require a Spotify client secret.

One native boundary remains:

- Native Apple Health access is not implemented in the product yet. Health plans and guided workouts remain testable without it.

## Installable iPhone preview

Use this when a Luminary home-screen icon, remote push notifications, or full native-link behavior must be tested. Spotify sign-in itself works in the free Expo Go path above.

The project already has an EAS `preview` profile. Building it requires Apple signing credentials and an active Apple Developer Program membership:

```powershell
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Register the test iPhone before building. When EAS finishes, open its installation link on that registered phone. This build runs without the development computer.

## Suggested field-test pass

1. Complete onboarding and create a test account.
2. Add and complete commitments from Home.
3. Generate a varied meal plan and open several recipe images.
4. Open a workout day, start the guided player, pause it, leave the app, and resume.
5. Create, edit, and remove a journal entry.
6. Add a purchase and review the Money summary.
7. Complete the nightly ritual and confirm tomorrow's Home guidance changes.
8. Force-close Expo Go, reopen the project, and confirm local progress remains.

Record the iPhone model, iOS version, screen, action, expected result, actual result, and a screenshot for each issue.
