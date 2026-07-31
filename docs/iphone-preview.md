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

The free Expo Go preview supports the application UI, local-first data, Supabase email/password access, Journal, Meals, Money, habits, the nightly ritual, camera capture, guided workouts, and local reminders.

Two native boundaries remain:

- Spotify OAuth cannot return through Luminary's custom app link inside Expo Go. The app explains this instead of opening a broken sign-in flow. Existing fixture/empty states remain testable.
- Native Apple Health access is not implemented in the product yet. Health plans and guided workouts remain testable without it.

## Installable iPhone preview

Use this when Spotify sign-in, a Luminary home-screen icon, remote push notifications, or full native-link behavior must be tested.

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
