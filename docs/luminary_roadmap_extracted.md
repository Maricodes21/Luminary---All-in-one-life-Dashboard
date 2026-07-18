__LUMINARY__

Personal Growth OS

__Development Roadmap & Handover Document__

Prepared for Cowork Development Handoff

April 2026

Version 1\.0

# 1\. Executive Summary

__Luminary__ is a mobile\-first personal growth operating system designed around a nightly wind\-down ritual\. The app combines habit tracking, mood journaling, Spotify\-powered music analysis, physical health monitoring, nutrition tracking, and budget management into a single cohesive experience\.

The core insight driving the product is that the app earns 3ΓÇô5 minutes of the userΓÇÖs evening, every night\. This consistency creates the foundation for all other features\. The Spotify integration serves as a passive mood signal ΓÇö the app pulls listening history and estimates mood via audio features \(valence, energy, tempo\), which the user confirms before optionally journaling about it\.

__Current state: __Static UI prototype with 6 screens \(Home, Habits, Journal, Health, Meals, Wallet\)\. All visual design is complete with a comprehensive design system \(DESIGN\.md\)\. The prototype needs to be brought to life with real data, user accounts, and API integrations\.

__Target state: __A functional MVP on iOS and Android with user authentication, persistent data, Spotify integration, and the core evening ritual flow\.

# 2\. Product Vision & Core Loop

The app is built around a single daily ritual that takes under 5 minutes:

1. __Open the app__ ΓÇö Spotify recap card shows what the user listened to today with a mood estimate\.
2. __Confirm mood__ ΓÇö User agrees with the estimate or adjusts it\. Optionally journaling with a prompt\.
3. __Check habits__ ΓÇö Tap to complete evening habits\. Streaks provide motivation\.
4. __Review summary__ ΓÇö Night wrap\-up card ties music, mood, and habits together\.
5. __Done__ ΓÇö Data feeds the weekly review and long\-term trend analysis\.

This ritual is the product\. Every other feature \(budget, meals, fitness\) exists to support or enrich it\.

# 3\. High\-Level Roadmap

The development is structured in 5 phases, building from foundation to full feature set\. Each phase has a clear deliverable that can be tested independently\.

__Phase__

__Focus__

__Timeline__

__Key Deliverable__

__Phase 0__

Project Setup & Infrastructure

Week 1ΓÇô2

Expo project, auth, navigation, DB schema

__Phase 1__

User Onboarding & Personalization

Week 3ΓÇô4

Complete onboarding flow with preferences saved

__Phase 2__

Core Evening Ritual \(MVP\)

Week 5ΓÇô8

Habit tracking \+ mood check\-in \+ Spotify recap

__Phase 3__

Reflection & Insights Layer

Week 9ΓÇô11

Journaling \+ weekly review \+ trend charts

__Phase 4__

Life Modules

Week 12ΓÇô16

Budget tracker, fitness log, meal planner

__Phase 5__

Polish & Launch Prep

Week 17ΓÇô18

Performance, app store submission, beta testing

# 4\. Phase 0 ΓÇö Project Setup & Infrastructure

### Goal

Establish the technical foundation\. After this phase, the app boots, authenticates users, and navigates between empty tab screens\.

### Tech Stack

__Task__

__Description__

__Acceptance Criteria__

__Priority__

__Framework__

React Native with Expo \(SDK 51\+\)\. Single codebase for iOS and Android\.

expo start runs on both platforms

Must have

__Navigation__

Expo Router \(file\-based\) with bottom tab navigator matching the 6\-tab layout\.

All 6 tabs navigate correctly

Must have

__Auth__

Supabase Auth with email/password \+ Google OAuth \+ Apple Sign\-In\.

User can register, login, and logout

Must have

__Database__

Supabase PostgreSQL with Row Level Security \(RLS\) policies\.

Schema created, RLS enforced

Must have

__State Mgmt__

Zustand for client state \+ React Query for server state/caching\.

Store configured, data fetches cached

Must have

__Design System__

Implement DESIGN\.md tokens as a theme provider: surface hierarchy, typography \(Manrope \+ Inter\), color tokens\.

All components use theme tokens

Must have

__Fonts__

Expo Google Fonts: Manrope \(600, 700, 800\) and Inter \(400, 500, 600, 700\)\.

Fonts load and render correctly

Must have

### Database Schema \(Initial\)

Core tables needed at this stage:

- __users__ ΓÇö id, email, created\_at, onboarding\_complete \(bool\)
- __profiles__ ΓÇö user\_id, display\_name, avatar\_url, weight, height, workout\_preference \(gym/home\), goals\_json
- __habits__ ΓÇö id, user\_id, name, icon, color, created\_at, archived
- __habit\_completions__ ΓÇö id, habit\_id, user\_id, completed\_at \(date\)
- __mood\_entries__ ΓÇö id, user\_id, date, mood\_label, mood\_source \(manual/spotify\), journal\_text, tags\_json
- __spotify\_snapshots__ ΓÇö id, user\_id, date, tracks\_count, minutes\_listened, top\_artists\_json, avg\_valence, avg\_energy, estimated\_mood
- __Additional tables__ \(journal\_entries, budget\_transactions, meals, workouts\) are added in their respective phases\.

# 5\. Phase 1 ΓÇö User Onboarding & Personalization

### Goal

After registration, guide the user through a multi\-step onboarding that captures their preferences, connects Spotify, and sets up their initial habits\. This data personalizes the entire app experience\.

## Onboarding Flow \(Screen by Screen\)

__Task__

__Description__

__Acceptance Criteria__

__Priority__

__Screen 1: Welcome__

Animated splash with Luminary branding\. Single CTA: ΓÇ£Get Started\.ΓÇ¥

Renders correctly, tapping advances

Must have

__Screen 2: Account__

Email/password registration OR Google/Apple OAuth\. Terms & privacy checkbox\.

User account created in Supabase

Must have

__Screen 3: Profile__

Name, avatar \(camera/gallery picker\), pronouns \(optional\)\.

Profile saved to profiles table

Must have

__Screen 4: Spotify__

Connect Spotify button triggering OAuth PKCE flow\. Skip option available\. Explain what data is used \(listening history only\)\.

Spotify tokens stored securely, refresh flow works

Must have

__Screen 5: Body__

Weight \(kg/lbs toggle\), height \(cm/ft toggle\)\. Optional ΓÇö can skip\. Used for fitness and meal modules\.

Values saved to profile

Should have

__Screen 6: Workout__

Binary choice: ΓÇ£GymΓÇ¥ or ΓÇ£HomeΓÇ¥ with icons\. Determines exercise suggestions throughout the app\.

Preference saved to profile

Must have

__Screen 7: Goals__

Multi\-select from: Better sleep, Build strength, Eat healthier, Save money, Read more, Reduce stress, Be more mindful\. Max 5 selections\.

Goals array saved to profile\.goals\_json

Must have

__Screen 8: Habits__

Pre\-populated habit suggestions based on goals\. User can add custom habits, remove defaults, reorder\. Minimum 3 required\.

Habits created in habits table

Must have

__Screen 9: Personality__

Tone preference: ΓÇ£Coach me hardΓÇ¥ / ΓÇ£Gentle nudgesΓÇ¥ / ΓÇ£Just the data\.ΓÇ¥ Affects notification copy, insight card language, journal prompts\.

Preference saved

Should have

__Screen 10: Ready__

Summary card showing chosen goals, habits, Spotify status\. CTA: ΓÇ£Start your first evening\.ΓÇ¥

Navigates to Home tab

Must have

### Spotify OAuth Details

Use SpotifyΓÇÖs Authorization Code with PKCE flow \(required for mobile apps, no client secret exposure\)\.

- __Scopes needed: __user\-read\-recently\-played, user\-top\-read, user\-read\-currently\-playing
- __Token storage: __Store access\_token and refresh\_token in Supabase \(encrypted column\) or expo\-secure\-store on device\.
- __Refresh strategy: __Tokens expire every 60 min\. Implement automatic refresh before API calls\.
- __Fallback: __If user skips Spotify or token fails, the mood check\-in screen appears without the music recap card\. Manual mood entry only\.

# 6\. Phase 2 ΓÇö Core Evening Ritual \(MVP Heart\)

### Goal

This is the MVP\. After this phase, the app delivers on its core promise: a nightly wind\-down ritual with habit tracking, Spotify mood analysis, and mood check\-in\. If you shipped only this, it would be a complete product\.

__Task__

__Description__

__Acceptance Criteria__

__Priority__

__Spotify Recap__

Call /v1/me/player/recently\-played \(last 24h\)\. Aggregate: track count, total duration, top 3 artists, average valence/energy/tempo\. Map audio features to mood label\.

Card renders with real data within 2 seconds\. Mood estimate displayed\.

Must have

__Mood Mapping__

Valence > 0\.6 \+ Energy > 0\.6 = Energized\. Valence > 0\.6 \+ Energy < 0\.4 = Peaceful\. Valence < 0\.4 \+ Energy > 0\.6 = Restless\. Valence < 0\.4 \+ Energy < 0\.4 = Melancholic\. Middle range = Reflective\.

Algorithm produces reasonable labels for diverse listening

Must have

__Mood Confirm__

User taps ΓÇ£ThatΓÇÖs about rightΓÇ¥ or selects alternative mood chip\. Saved to mood\_entries with source=spotify\.

Mood stored with date, label, source

Must have

__Journal Prompt__

After mood confirmation: ΓÇ£Your music felt heavy today ΓÇö want to write about why?ΓÇ¥ Optional free\-text input\. Contextual focus tags\.

Journal text saved if entered\. Tags saved\.

Must have

__Habit Check\-in__

Render userΓÇÖs habits with tap\-to\-complete\. Calculate streak from consecutive days in habit\_completions\. Show streak count\.

Habits persist across sessions\. Streaks calculate correctly\. Missed day resets streak\.

Must have

__Night Summary__

After habits: summary card showing mood, habits completed, music stats\. ΓÇ£See you tomorrow evening\.ΓÇ¥

Summary renders with all correct data

Must have

__Push Notification__

Schedule a daily reminder at user\-chosen time \(default 9 PM\)\. ΓÇ£Time to wind down\. Your evening check\-in is waiting\.ΓÇ¥

Notification fires at scheduled time

Should have

__Offline Support__

Cache todayΓÇÖs data locally\. Sync when connection returns\. Habits and mood can be logged offline\.

App works without internet for core ritual

Should have

## Spotify API Integration Details

The Spotify integration is the appΓÇÖs key differentiator\. HereΓÇÖs the technical breakdown:

__Endpoint__

__Purpose__

__Notes__

__/v1/me/player/recently\-played__

Get tracks played in last 24h \(max 50\)

Use 'after' param with midnight timestamp\. Paginate if needed\.

__/v1/audio\-features?ids=\.\.\.__

Get valence, energy, tempo, danceability per track

Batch up to 100 IDs per call\. Cache results\.

__/v1/me/top/artists?time\_range=short\_term__

Top artists last 4 weeks

Used for artist display cards\. Limit=3\.

# 7\. Phase 3 ΓÇö Reflection & Insights Layer

### Goal

Add depth to the ritual\. Past entries become searchable, mood trends become visible, and the weekly review gives users a reason to keep coming back\.

__Task__

__Description__

__Acceptance Criteria__

__Priority__

__Journal List__

Scrollable timeline of past journal entries\. Search bar\. Filter by tag \(All, Personal, Gratitude, Dreams, etc\)\.

Entries load with pagination\. Search returns results\.

Must have

__Mood Trends__

Line chart showing mood over 7 days/30 days\. Current mood state label \(Resilient, Stable, Struggling\)\. Uses recharts or victory\-native\.

Chart renders accurately from real data

Must have

__Weekly Review__

Every Sunday: auto\-generated summary\. Habits completion rate, mood trend, top Spotify artist, journal highlights, budget snapshot\.

Review generates from accumulated data

Should have

__Guided Prompts__

Daily rotating journal prompts based on mood and goals\. ΓÇ£What surprised you today?ΓÇ¥ ΓÇ£Name one thing youΓÇÖre grateful for\.ΓÇ¥

Prompts rotate, mood\-contextual

Should have

__Insight Cards__

AI\-generated micro\-insights on Home tab\. ΓÇ£YouΓÇÖve been consistent 3 days in a row\.ΓÇ¥ ΓÇ£Your mood dips on Wednesdays\.ΓÇ¥

Insights generate from pattern detection

Nice to have

# 8\. Phase 4 ΓÇö Life Modules

### Goal

Bolt on the three life modules: budget, fitness, and meals\. Each is self\-contained and optional ΓÇö users enable what they want during onboarding or later in settings\.

## 8a\. Wallet / Budget Module

__Task__

__Description__

__Acceptance Criteria__

__Priority__

__Monthly Overview__

Total balance, income vs expenses bar chart\. Period selector \(month/week\)\.

Correct totals from transaction data

Must have

__Expense Logging__

Quick\-add FAB\. Amount, category, note\. Categories: Needs, Wants, Savings, Emergencies \(user\-customizable\)\.

Transaction saved and reflected in totals

Must have

__Category Budgets__

Progress bars per category against monthly budget\. Color\-coded \(green/amber/red by % used\)\.

Budgets calculate correctly

Must have

__Savings Goals__

Named goals with target amount and progress\. ΓÇ£New SSD ΓÇö 75% done\.ΓÇ¥

Progress tracks against target

Should have

__Upcoming Bills__

Recurring bills with due dates and amounts\. Notification reminders\.

Bills display sorted by due date

Should have

## 8b\. Health / Fitness Module

__Task__

__Description__

__Acceptance Criteria__

__Priority__

__Steps Ring__

Daily step count from device health APIs \(Apple Health / Google Fit\)\. Circular progress toward goal\.

Reads real step data\. Ring animates\.

Must have

__Workout Suggestions__

Based on gym/home preference from onboarding\. Day\-specific workout with muscle group, duration, and exercises\.

Correct workout type for preference

Must have

__Weekly Plan__

Calendar view of workout plan\. Completed/current/upcoming states\.

Plan persists and tracks completion

Should have

__Vitals Grid__

Heart rate, SpO2, sleep score, kcal burned\. Pulled from device health APIs\.

Reads and displays real data

Nice to have

__Strength Tracking__

Log sets/reps/weight\. Track projected 1RM over time with chart\.

Data persists, chart updates

Nice to have

## 8c\. Meals / Nutrition Module

__Task__

__Description__

__Acceptance Criteria__

__Priority__

__Daily Summary__

Calories remaining, macro breakdown \(protein/carbs/fats\) with progress bars\.

Macros calculate from logged meals

Must have

__Meal Protocol__

Timeline of todayΓÇÖs meals\. Tap to mark tracked\. Shows next meal highlighted\.

Meals display in order\. Tracking persists\.

Must have

__Week Strip__

Day selector to view past/future meal plans\.

Switching days loads correct data

Must have

__Smart Suggestions__

Based on remaining macro targets\. ΓÇ£60g protein left ΓÇö try Miso Salmon\.ΓÇ¥

Suggestions reflect actual remaining targets

Should have

__Quick Log__

Search food database or enter custom meal with estimated macros\.

Meal added and reflected in daily totals

Should have

# 9\. Phase 5 ΓÇö Polish & Launch Prep

__Task__

__Description__

__Acceptance Criteria__

__Priority__

__Performance__

App loads in < 2s\. Smooth 60fps scrolling\. Lazy load non\-visible tabs\.

Lighthouse\-equivalent mobile audit passes

Must have

__Animations__

Screen transitions, habit check\-off haptics, streak celebration, mood chip selection\. Use react\-native\-reanimated\.

Key interactions have tactile feedback

Should have

__Error Handling__

Graceful fallbacks for Spotify disconnect, network loss, API errors\. Toast notifications for user feedback\.

No unhandled crashes in test suite

Must have

__Accessibility__

Screen reader labels, sufficient contrast ratios, touch target sizes \(min 44pt\)\.

Passes basic a11y audit

Must have

__App Store__

App icons, screenshots, description, privacy policy\. TestFlight \(iOS\) and internal testing \(Android\)\.

Submitted to both stores

Must have

__Beta Testing__

10ΓÇô20 beta users for 2 weeks\. Collect feedback via in\-app form or survey\.

Feedback collected and triaged

Should have

# 10\. Design System Reference

The full design system is documented in DESIGN\.md \(included in the handover assets\)\. Key principles:

- __Surface Hierarchy: __Base \(\#0c0e10\) ΓåÆ Container Low \(\#111416\) ΓåÆ Container \(\#171a1c\) ΓåÆ Container High \(\#1d2022\) ΓåÆ Container Highest \(\#232629\)\. Depth through tonal layering, never drop shadows\.
- __The No\-Line Rule: __No 1px borders for sectioning\. All boundaries via background color shifts\. Ghost borders \(outline\-variant at 15% opacity\) only when contrast is insufficient\.
- __Typography: __Manrope for headlines/display \(600ΓÇô800 weight\), Inter for body/labels \(400ΓÇô600\)\. Display text uses tight letter\-spacing \(\-0\.02em\)\. Labels use uppercase \+ 0\.05em tracking\.
- __Accent Colors: __Primary \(\#8cacff\) for focus/active\. Secondary \(\#fe7d5e\) for warmth/urgency\. Tertiary \(\#b6ffbf / \#49ee7f\) for success/completion\. Error \(\#ff716c\) for warnings\.
- __Glassmorphism: __Navigation bars and floating headers use surface\-variant at 60% opacity with backdrop\-filter: blur\(20px\)\.
- __Corner Radii: __Cards: 20ΓÇô24px\. Buttons: 16px\. Chips: 14ΓÇô16px\. Input fields: 12px\. FAB: 16px\.

# 11\. Handover Assets Checklist

__Asset__

__Format__

__Status__

Home Dashboard mockup \+ code

screen\.png \+ code\.html

Complete

Guided Journal mockup \+ code

screen\.png \+ code\.html

Complete

Journal Full \(entries list\) mockup \+ code

screen\.png \+ code\.html

Complete

Budget Tracker mockup \+ code

screen\.png \+ code\.html

Complete

Physical Health mockup \+ code

screen\.png \+ code\.html

Complete

Meal Planner mockup \+ code

screen\.png \+ code\.html

Complete

Design System specification

DESIGN\.md

Complete

Functional React prototype \(all 6 tabs\)

luminary\.jsx

Complete

This roadmap document

\.docx

Complete

Spotify API mood mapping algorithm

Described in Phase 2

Spec complete

Database schema

Described in Phase 0

Spec complete

Onboarding flow \(10 screens\)

Described in Phase 1

Spec complete

# 12\. MVP Definition ΓÇö What ΓÇ£DoneΓÇ¥ Looks Like

The Minimum Viable Product is Phases 0ΓÇô2 complete\. At MVP, a user can:

1. Download the app and create an account
2. Complete onboarding \(profile, Spotify, goals, habits, preferences\)
3. Open the app each evening and see their Spotify listening recap with mood estimate
4. Confirm or adjust their mood, optionally journal about it
5. Check off their daily habits and see streaks
6. See a nightly summary tying mood, music, and habits together
7. Receive a push notification reminding them to check in
8. Have all data persist across sessions and survive app restarts

*Everything beyond this ΓÇö journal history, weekly reviews, budget, fitness, meals ΓÇö is a post\-MVP enhancement\. *__Ship the ritual first\.__

