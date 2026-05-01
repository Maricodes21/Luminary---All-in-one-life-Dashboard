# One-time setup

The full source tree is scaffolded. Two manual steps remain — they need to run on your machine, not from the chat sandbox (Windows file permissions block git metadata writes from this side).

## 1. Initialize git + clean up sandbox artifacts

There's a partially-created `.git/` folder from a sandbox attempt and one renamed leftover file (`mobile/components/ui/_Symbol.tsx.deprecated`) that the sandbox couldn't unlink — they need to be removed first.

**PowerShell** (run from `C:\Users\mruga\Documents\Claude\Projects\multi-app`):

```powershell
# Wipe the half-created .git folder
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue

# Remove the leftover deprecated stub the sandbox couldn't unlink
Remove-Item -Force mobile\components\ui\_Symbol.tsx.deprecated -ErrorAction SilentlyContinue

# Init fresh
git init -b main
git config user.email "mrugani71@gmail.com"
git config user.name "Mari"

# First commit
git add -A
git commit -m "Phase 0 scaffold — monorepo, design system, mobile shell, supabase initial schema"

# Long-lived development branch
git branch develop

git log --oneline
```

That's it. We're now on `main`, with a `develop` branch ready for feature work.

## 2. Install dependencies

The repo uses npm workspaces — run from the root, dependencies install for every workspace.

```powershell
# Make sure you're on Node 20+
node --version

# Install all workspaces
npm install

# Boot the mobile dev server
cd mobile
copy .env.example .env   # then edit with real keys
npm run start
```

If you don't have Expo Go on your phone yet, the dev server prints a QR code and a link.

## 3. (When you're ready) Supabase

```powershell
# Install Supabase CLI
scoop install supabase    # or via direct download from supabase.com/docs/guides/cli

cd supabase
supabase init
supabase start
supabase db reset         # applies migrations/0001_initial_schema.sql
```

Copy the local URL + anon key from `supabase status` into `mobile/.env`.

---

After step 1 finishes you have a real, browsable, committed repo. Step 2 gets the app booting. Step 3 plugs in the backend.
