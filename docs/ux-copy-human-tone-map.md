# Human-tone copy map

This map keeps Luminary calm and thoughtful while making the product easier to scan. The main change is to say what happened, what the user can do, and what happens next in ordinary language.

## Voice rules

- Lead with the useful fact. Put explanation second.
- Prefer familiar verbs: add, plan, save, skip, pause, and change.
- Keep card descriptions to one short sentence. Remove a description when the title and action already explain the card.
- Use encouragement only when it responds to something the user did. Avoid motivational language on every screen.
- Do not make optional actions sound unfinished or overdue.
- Explain recommendations where they appear. Keep the existing **Why this came up** pattern.
- Use the same word for the same object: **commitment**, **meal plan**, **workout**, **journal entry**, and **nightly ritual**.
- Write buttons as direct actions. Avoid labels such as “Continue” when the next action can be named.

## Priority changes

| Area | Current copy | Proposed copy | Why |
| --- | --- | --- | --- |
| Home | Your day, connected. | Your day so far. | Sounds like a useful status, not a product claim. |
| Home | Commitments, useful signals and tonight belong to one continuous loop. | See what needs attention now and what can wait until tonight. | Explains what the screen does. |
| Home | Open commitments hub | See all commitments | Uses the user’s goal rather than the interface name. |
| Home | Movement captured for today. | Workout done for today. | More familiar and specific. |
| Home | Today’s purchases are captured. | Purchases logged for today. | Matches the action users take. |
| Home | Your day already has a page. | You wrote in your journal today. | Removes metaphor where a status is more useful. |
| Ritual | 75 seconds, roughly | About 75 seconds | Shorter and more natural. |
| Ritual | Optional tonight · 3 unfinished | If you want · 3 things left | Keeps optional items from feeling like failed tasks. |
| Ritual | Meals, Money and Health only appear when something is unfinished. | These only appear when there may be something worth checking. | Reduces system language and pressure. |
| Ritual | Open one now, or leave every card for tomorrow. | Check one now, or leave it for tomorrow. | Shorter without changing the choice. |
| Ritual | Your essentials are covered. | You’re done for today. | Clear completion language. |
| Ritual | There are no extra check-ins asking for your attention. | Nothing else needs your attention. | Says the same thing with half the weight. |
| Health | Your plan, your shape | Change your week | Makes the section’s purpose immediately clear. |
| Health | How should it meet you? | How much experience do you have? | Removes an unclear metaphor. |
| Health | The week is building, not testing you. | Add reps only when the last session felt good. | Gives concrete guidance. |
| Health | Health signals connected | Health data connected | Uses a phrase people already know. |
| Health | Useful, never required | Connect Health if you want | Makes the optional action explicit. |
| Meals | A flexible plan, not a rigid template | Plan meals your way. | Positive and direct. |
| Meals | Meals are selected from validated recipes around your target, timing, and preferences. Every card opens a complete prep guide. | We’ll pick recipes that fit your goals, food preferences, and available time. | Removes technical validation language. |
| Meals | Create my week | Build my meal plan | Names the thing being created. |
| Journal | Your inner weather. | Your week in your own words. | Keeps warmth while describing the timeline. |
| Journal | Entries, distilled nights and recurring themes share one chronological story. | Scroll through this week’s notes and nightly reflections. | Explains the interaction and content. |
| Habits | Flexible rhythm, visible progress | Your week at a glance | Easier to understand at a glance. |
| Habits | Keep the promise. Adjust the rhythm. | Keep what fits this week. | Gentler and less demanding. |
| Habits | No penalties for a lighter day | Nothing paused today | Reports state without commentary. |
| Habits | Consistency, not a brittle streak | Based on your weekly goal | Explains the percentage. |
| Money | R… unassigned income | R… left to plan | Less accounting language. |
| Money | Assign in budget plan | Plan this money | A more direct action. |
| Money | Quick capture | Add purchase | Matches the user’s mental model. |

## Button language

| Avoid | Prefer |
| --- | --- |
| Continue | See my music / Review commitments / Finish tonight |
| Dismiss evaluation | That doesn’t feel right |
| Accept analysis | That feels right |
| Edit rhythm | Edit |
| Rest | Pause |
| Initiate / generate | Start / build |
| Capture | Add / log |
| View details | See workout / See recipe / Read entry |

## Rollout order

1. **Home and nightly ritual:** These screens are used most often and establish the voice for the rest of the product.
2. **Health and Meals:** Simplify setup questions, generated-plan explanations, empty states, and swap actions.
3. **Journal, Commitments, and Money:** Shorten headings and status messages without changing the approved layouts.
4. **Settings, onboarding, errors, and loading states:** Apply the same vocabulary once the main product voice is approved.

## Guardrails for dynamic copy

- Time-based cards should name the current action: **Make breakfast**, **See today’s workout**, or **Log a purchase**.
- Recommendation cards should include one reason, not a paragraph: **Because you planned a quick dinner for 18:30.**
- Empty states should offer one next step. Do not explain the entire feature.
- Error messages should say what was saved, what was not, and what the user can do next.
- AI-assisted text must be presented as a suggestion and remain editable. Avoid claiming to know how the user feels.

This is a review map, not a blanket rewrite. Copy should be updated area by area alongside the approved screen work so existing flows and carefully chosen ritual language are not changed without review.
