import type { Habit } from '@/stores/useProductionStore';

export type DailySignalSource = 'commitments' | 'meals' | 'health' | 'money' | 'journal' | 'ritual' | 'music';
export type DailySignalResponse = 'shown' | 'dismissed' | 'not_accurate' | 'helpful' | 'actioned';

export type DailySignal = {
  id: string;
  key: string;
  source: DailySignalSource;
  /** Temporary presentation alias while older cards migrate to `source`. */
  kind: DailySignalSource;
  family: string;
  title: string;
  detail: string;
  action: string;
  route: string;
  confidence: number;
  priority: number;
  evidence: string[];
  evidenceHash: string;
  generatedAt: string;
  expiresAt: string;
  cooldownKey: string;
  templateId: string;
  requiresConsent: string[];
  imageUrl?: string;
  urgent?: boolean;
};

export type SignalInteraction = {
  signalId: string;
  key: string;
  family: string;
  templateId: string;
  evidenceHash: string;
  occurredAt: string;
  response: DailySignalResponse;
};

export type DailySignalContext = {
  now: Date;
  habits: Habit[];
  loggedMealTypes: string[];
  plannedMeals?: Array<{ mealType: string; name: string; imageUrl?: string }>;
  purchaseCount: number;
  pendingExpenseCount?: number;
  workout: { planned: boolean; completed: boolean; title?: string; imageUrl?: string; steps?: number };
  journal: { entryCount: number; recentTags?: string[] };
  ritual: { status: 'not_started' | 'in_progress' | 'completed' };
  music: { connected: boolean; recapAvailable: boolean };
};

type SignalRule = {
  id: string;
  source: DailySignalSource;
  family: string;
  confidence: number;
  priority: number;
  route: string;
  action: string;
  urgent?: boolean;
  when: (context: DailySignalContext) => boolean;
  evidence: (context: DailySignalContext) => string[];
  variants: Array<{ title: string; detail: string }>;
  imageUrl?: (context: DailySignalContext) => string | undefined;
};

const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
const expectedMeal = (date: Date): typeof mealTypes[number] => date.getHours() < 11 ? 'breakfast' : date.getHours() < 16 ? 'lunch' : 'dinner';
const completedHabits = (context: DailySignalContext) => context.habits.filter((habit) => habit.completedOn.includes(dateKey(context.now))).length;
const openHabits = (context: DailySignalContext) => Math.max(0, context.habits.length - completedHabits(context));
const plannedMeal = (context: DailySignalContext, type = expectedMeal(context.now)) => context.plannedMeals?.find((meal) => meal.mealType.toLowerCase() === type);
const mealLogged = (context: DailySignalContext, type = expectedMeal(context.now)) => context.loggedMealTypes.some((meal) => meal.toLowerCase() === type);

const rules: SignalRule[] = [
  habitRule('commitment-morning', 'commitment-window-morning', 76, 0, 11, 'Your morning promises are here', 'A small start can carry the rest of the day.'),
  habitRule('commitment-day', 'commitment-window-day', 72, 11, 17, 'A commitment fits here', 'There is still room for one thing you chose today.'),
  habitRule('commitment-evening', 'commitment-window-evening', 78, 17, 24, 'One promise is still open', 'Choose what still fits tonight and leave the rest honestly.'),
  {
    id: 'commitments-several-open', source: 'commitments', family: 'commitment-load', confidence: .82, priority: 78,
    route: '/habits', action: 'Review commitments', when: (c) => openHabits(c) >= 3,
    evidence: (c) => [`${openHabits(c)} scheduled commitments remain`],
    variants: [
      { title: 'Choose the one that matters most', detail: 'Several commitments are open. You do not need to do them all at once.' },
      { title: 'What still deserves today?', detail: 'Review the commitments that remain and keep the day realistic.' },
      { title: 'Make the next promise smaller', detail: 'A few commitments are still open. Start with the easiest useful one.' },
    ],
  },
  {
    id: 'commitments-complete', source: 'commitments', family: 'commitment-complete', confidence: .98, priority: 42,
    route: '/habits', action: 'See your day', when: (c) => c.habits.length > 0 && openHabits(c) === 0,
    evidence: (c) => [`${completedHabits(c)} of ${c.habits.length} commitments completed`],
    variants: [
      { title: 'Your commitments are complete', detail: 'The things you chose for today are all accounted for.' },
      { title: 'You kept today’s promises', detail: 'Every scheduled commitment has been checked in.' },
      { title: 'Today’s list is settled', detail: 'Your commitments are complete. Let that be enough.' },
    ],
  },
  {
    id: 'commitments-skipped', source: 'commitments', family: 'commitment-rest', confidence: .96, priority: 35,
    route: '/habits', action: 'View commitments', when: (c) => c.habits.some((habit) => habit.skippedOn?.includes(dateKey(c.now))),
    evidence: (c) => [`${c.habits.filter((habit) => habit.skippedOn?.includes(dateKey(c.now))).length} intentionally skipped today`],
    variants: [
      { title: 'A lighter day is still a plan', detail: 'An intentional skip keeps the history honest without resetting anything.' },
      { title: 'You made room today', detail: 'A commitment was skipped intentionally. Its earlier history stays intact.' },
      { title: 'Rest can be deliberate', detail: 'Today’s exception is recorded without changing the rhythm ahead.' },
    ],
  },
  ...mealTypes.flatMap((type, index) => [
    mealGapRule(type, 88 - index),
    plannedMealRule(type, 94 - index),
  ]),
  {
    id: 'meals-day-complete', source: 'meals', family: 'meal-complete', confidence: .98, priority: 35,
    route: '/(tabs)/meals', action: 'See today’s meals', when: (c) => mealTypes.every((type) => mealLogged(c, type)),
    evidence: () => ['Breakfast, lunch and dinner are logged'],
    variants: [
      { title: 'Today’s meals are captured', detail: 'Breakfast, lunch and dinner are all in one place.' },
      { title: 'Your meal day is complete', detail: 'The three main meals are logged for today.' },
      { title: 'Food logging is settled', detail: 'Your main meals are accounted for today.' },
    ],
  },
  {
    id: 'meals-shopping', source: 'meals', family: 'meal-shopping', confidence: .9, priority: 48,
    route: '/(tabs)/meals', action: 'Open meal plan', when: (c) => (c.plannedMeals?.length ?? 0) >= 3 && c.now.getHours() < 12,
    evidence: (c) => [`${c.plannedMeals?.length ?? 0} meals planned`],
    variants: [
      { title: 'Your plan can become a shopping list', detail: 'Gather the week’s ingredients before the day gets busy.' },
      { title: 'Prep the plan you already made', detail: 'Your planned meals are ready to turn into one ingredient list.' },
      { title: 'Make the week easier to cook', detail: 'Check what your planned meals need before shopping.' },
    ],
  },
  {
    id: 'health-workout-due', source: 'health', family: 'workout-due', confidence: .96, priority: 86,
    route: '/(tabs)/health', action: 'Open workout', when: (c) => c.workout.planned && !c.workout.completed,
    evidence: (c) => [c.workout.title ? `${c.workout.title} is scheduled today` : 'A workout is scheduled today'],
    imageUrl: (c) => c.workout.imageUrl,
    variants: [
      { title: '{workout}', detail: 'Today’s movement is ready when you are.' },
      { title: 'Your next movement is ready', detail: '{workout} is scheduled for today.' },
      { title: 'Make space for today’s session', detail: '{workout} is waiting in Health.' },
    ],
  },
  {
    id: 'health-workout-complete', source: 'health', family: 'workout-complete', confidence: .99, priority: 38,
    route: '/(tabs)/health', action: 'See workout', when: (c) => c.workout.completed,
    evidence: (c) => [c.workout.title ? `${c.workout.title} completed today` : 'A workout was completed today'],
    variants: [
      { title: 'Movement is captured', detail: 'Today’s workout is already part of your day.' },
      { title: 'Your session is complete', detail: 'The movement you logged is safely recorded.' },
      { title: 'Today moved forward', detail: 'Your completed workout is ready for tonight’s recap.' },
    ],
  },
  {
    id: 'health-rest-day', source: 'health', family: 'workout-rest', confidence: .78, priority: 28,
    route: '/(tabs)/health', action: 'See the week', when: (c) => !c.workout.planned && !c.workout.completed,
    evidence: () => ['No workout is scheduled today'],
    variants: [
      { title: 'No workout is scheduled today', detail: 'Keep the rest day, or open Health if you want gentle movement.' },
      { title: 'Today has no planned session', detail: 'Your plan leaves room to recover or move lightly.' },
      { title: 'Your movement plan is quiet today', detail: 'There is no scheduled workout asking for your attention.' },
    ],
  },
  {
    id: 'health-plan-missing', source: 'health', family: 'workout-plan', confidence: .92, priority: 24,
    route: '/health/setup', action: 'Build a plan', when: (c) => !c.workout.planned && !c.workout.completed && c.now.getDay() === 1,
    evidence: () => ['No workout plan is active for this week'],
    variants: [
      { title: 'Want a movement plan for the week?', detail: 'There is no active workout plan. Build one only if it would help.' },
      { title: 'This week has room for a plan', detail: 'Choose a rhythm, level and place that fit how you want to move.' },
      { title: 'Make movement easier to start', detail: 'A simple weekly plan can prepare the next session for you.' },
    ],
  },
  {
    id: 'health-steps', source: 'health', family: 'movement-progress', confidence: .95, priority: 44,
    route: '/(tabs)/health', action: 'See movement', when: (c) => (c.workout.steps ?? 0) > 0,
    evidence: (c) => [`${c.workout.steps} steps recorded`],
    variants: [
      { title: 'Your day has movement in it', detail: '{steps} steps are already part of today.' },
      { title: 'Movement is adding up', detail: 'You have {steps} steps recorded today.' },
      { title: 'Today is already in motion', detail: '{steps} steps have been captured.' },
    ],
  },
  {
    id: 'money-check-in', source: 'money', family: 'money-log', confidence: .7, priority: 58,
    route: '/(tabs)/money', action: 'Add purchase', when: (c) => c.purchaseCount === 0 && c.now.getHours() >= 17,
    evidence: () => ['Nothing has been logged in Money today'],
    variants: [
      { title: 'Anything to add from today?', detail: 'Nothing has been logged in Money. Add a purchase only if there is one.' },
      { title: 'Did anything need logging?', detail: 'Money has no entries for today. Leave it as-is if that is accurate.' },
      { title: 'A quick money check-in?', detail: 'There are no purchases logged today. Add one if it belongs here.' },
    ],
  },
  {
    id: 'money-logged', source: 'money', family: 'money-logged', confidence: .99, priority: 32,
    route: '/(tabs)/money', action: 'See today', when: (c) => c.purchaseCount > 0,
    evidence: (c) => [`${c.purchaseCount} purchase${c.purchaseCount === 1 ? '' : 's'} logged`],
    variants: [
      { title: 'Today’s money is captured', detail: '{purchases} purchase entries are in place.' },
      { title: 'Your spending log has today covered', detail: '{purchases} purchases are recorded.' },
      { title: 'Money has an update for today', detail: 'You logged {purchases} purchase entries.' },
    ],
  },
  {
    id: 'money-pending', source: 'money', family: 'money-pending', confidence: .99, priority: 92, urgent: true,
    route: '/(tabs)/money', action: 'Review prompts', when: (c) => (c.pendingExpenseCount ?? 0) > 0,
    evidence: (c) => [`${c.pendingExpenseCount} captured notification${c.pendingExpenseCount === 1 ? '' : 's'} need review`],
    variants: [
      { title: 'A captured purchase needs your review', detail: 'Confirm or dismiss the notification Luminary found.' },
      { title: 'Review a Money suggestion', detail: 'A captured notification is waiting for your decision.' },
      { title: 'There is a purchase prompt to check', detail: 'Open Money to confirm what belongs in your log.' },
    ],
  },
  {
    id: 'journal-evening', source: 'journal', family: 'journal-opportunity', confidence: .68, priority: 50,
    route: '/(tabs)/journal', action: 'Open Journal', when: (c) => c.journal.entryCount === 0 && c.now.getHours() >= 18,
    evidence: () => ['No journal entry is recorded today'],
    variants: [
      { title: 'Is there anything worth keeping?', detail: 'Journal has no entry for today. A sentence is enough.' },
      { title: 'Want to hold onto one thought?', detail: 'There is no journal entry today. Write only if something matters.' },
      { title: 'Give today one line?', detail: 'Nothing is written in Journal yet. You can keep it brief.' },
    ],
  },
  {
    id: 'journal-entry', source: 'journal', family: 'journal-complete', confidence: .99, priority: 30,
    route: '/(tabs)/journal', action: 'Read today', when: (c) => c.journal.entryCount > 0,
    evidence: (c) => [`${c.journal.entryCount} journal entr${c.journal.entryCount === 1 ? 'y' : 'ies'} today`],
    variants: [
      { title: 'Today already has a page', detail: 'Your journal entry is ready to return to.' },
      { title: 'You kept something from today', detail: 'Journal already holds part of this day.' },
      { title: 'Your day has been written down', detail: 'There is already an entry in Journal.' },
    ],
  },
  {
    id: 'journal-tag-return', source: 'journal', family: 'journal-pattern', confidence: .76, priority: 34,
    route: '/(tabs)/journal', action: 'See patterns', when: (c) => (c.journal.recentTags?.length ?? 0) > 0,
    evidence: (c) => [`Recent tags: ${c.journal.recentTags?.slice(0, 3).join(', ')}`],
    variants: [
      { title: 'A recent theme is still nearby', detail: 'Your recent tags can help you notice what is repeating.' },
      { title: 'Your journal has a thread to follow', detail: 'A recent tag appears in your current reflection window.' },
      { title: 'Something may be forming in Journal', detail: 'Review the themes attached to your latest entries.' },
    ],
  },
  {
    id: 'ritual-resume', source: 'ritual', family: 'ritual-resume', confidence: 1, priority: 100, urgent: true,
    route: '/ritual', action: 'Resume tonight', when: (c) => c.ritual.status === 'in_progress',
    evidence: () => ['Tonight’s ritual is in progress'],
    variants: [
      { title: 'Your evening is waiting', detail: 'Continue from where you left off.' },
      { title: 'Pick tonight back up', detail: 'Your ritual is saved at the last completed step.' },
      { title: 'Continue your close-out', detail: 'Nothing was lost when you stepped away.' },
    ],
  },
  {
    id: 'ritual-ready', source: 'ritual', family: 'ritual-ready', confidence: .96, priority: 89,
    route: '/ritual', action: 'See tonight', when: (c) => c.ritual.status === 'not_started' && c.now.getHours() >= 18,
    evidence: () => ['Tonight’s ritual has not started'],
    variants: [
      { title: 'Close the day while it is fresh', detail: 'Music, mood, commitments and tomorrow take about 75 seconds.' },
      { title: 'Tonight is ready when you are', detail: 'Take a short look back before planning tomorrow.' },
      { title: 'Bring today to a gentle close', detail: 'Your nightly check-in is ready.' },
    ],
  },
  {
    id: 'ritual-complete', source: 'ritual', family: 'ritual-complete', confidence: 1, priority: 26,
    route: '/ritual/summary', action: 'See recap', when: (c) => c.ritual.status === 'completed',
    evidence: () => ['Tonight’s ritual is complete'],
    variants: [
      { title: 'Tonight is complete', detail: 'Your recap and tomorrow cue are ready.' },
      { title: 'The day is closed', detail: 'Your nightly summary is saved.' },
      { title: 'You finished tonight', detail: 'Return to the recap whenever you need it.' },
    ],
  },
  {
    id: 'music-recap', source: 'music', family: 'listening-recap', confidence: 1, priority: 45,
    route: '/ritual', action: 'See listening recap', when: (c) => c.music.connected && c.music.recapAvailable,
    evidence: () => ['A Spotify listening recap is available'],
    variants: [
      { title: 'Your listening recap is ready', detail: 'See the tracks and artists that stayed with you.' },
      { title: 'Today had a soundtrack', detail: 'Your Spotify listening facts are ready to view.' },
      { title: 'See what you returned to today', detail: 'Your top tracks and artists are waiting.' },
    ],
  },
  {
    id: 'music-connect', source: 'music', family: 'listening-connect', confidence: .98, priority: 22,
    route: '/settings', action: 'Connect Spotify', when: (c) => !c.music.connected,
    evidence: () => ['Spotify is not connected'],
    variants: [
      { title: 'Add your listening recap', detail: 'Connect Spotify if you want music to appear in tonight’s ritual.' },
      { title: 'Bring music into tonight', detail: 'Spotify connection is optional and used only for your listening recap.' },
      { title: 'Your ritual works without Spotify', detail: 'Connect only if you want top tracks and artists beside it.' },
    ],
  },
  {
    id: 'music-no-recap', source: 'music', family: 'listening-empty', confidence: 1, priority: 18,
    route: '/ritual', action: 'Continue without music', when: (c) => c.music.connected && !c.music.recapAvailable,
    evidence: () => ['Spotify is connected and no listening recap is available today'],
    variants: [
      { title: 'No listening recap yet today', detail: 'Tonight still works without music. Nothing else is inferred.' },
      { title: 'Music is quiet in today’s recap', detail: 'Spotify is connected, but there is no listening activity to show.' },
      { title: 'Your ritual does not need a soundtrack', detail: 'There is no Spotify recap today, so Luminary will simply move on.' },
    ],
  },
];

export function generateDailySignals(context: DailySignalContext, interactions: SignalInteraction[] = []): DailySignal[] {
  const now = context.now;
  const day = dateKey(now);
  const candidates = rules
    .filter((rule) => rule.when(context))
    .map((rule) => materialize(rule, context, day))
    .filter((signal) => signal.confidence >= .55)
    .filter((signal) => !isSuppressed(signal, interactions, now));

  const selected: DailySignal[] = [];
  const sources = new Set<DailySignalSource>();
  const families = new Set<string>();
  for (const signal of candidates.sort((a, b) => b.priority - a.priority || b.confidence - a.confidence || a.id.localeCompare(b.id))) {
    if (selected.length >= 3) break;
    if (families.has(signal.family)) continue;
    if (sources.has(signal.source) && !signal.urgent) continue;
    selected.push(signal);
    sources.add(signal.source);
    families.add(signal.family);
  }
  return selected;
}

export function allDailySignalRuleIds(): string[] {
  return rules.map((rule) => rule.id);
}

export function validateMoodPayload(payload: Record<string, unknown>): boolean {
  const forbidden = /(spotify|track|artist|album|artwork|listening|recap|tempo|valence|audio[_-]?feature)/i;
  return !walkKeys(payload).some((key) => forbidden.test(key));
}

function habitRule(id: string, family: string, priority: number, fromHour: number, untilHour: number, title: string, detail: string): SignalRule {
  return {
    id, source: 'commitments', family, confidence: .88, priority, route: '/habits', action: 'Open commitments',
    when: (c) => c.now.getHours() >= fromHour && c.now.getHours() < untilHour && openHabits(c) > 0,
    evidence: (c) => [`${openHabits(c)} scheduled commitment${openHabits(c) === 1 ? '' : 's'} remain`],
    variants: [
      { title, detail },
      { title: 'One small promise can fit here', detail: 'Your open commitments are ready when the timing feels right.' },
      { title: 'Your next commitment is close', detail: 'Open the Hub to choose what belongs in this part of the day.' },
    ],
  };
}

function mealGapRule(type: typeof mealTypes[number], priority: number): SignalRule {
  return {
    id: `meal-${type}-gap`, source: 'meals', family: `meal-${type}`, confidence: .7, priority,
    route: '/(tabs)/meals', action: 'Log meal',
    when: (c) => expectedMeal(c.now) === type && !mealLogged(c, type) && !plannedMeal(c, type),
    evidence: () => [`Nothing has been logged for ${type}`],
    variants: [
      { title: `Anything to log for ${type}?`, detail: `Nothing has been logged for ${type}. Add it only if you ate.` },
      { title: `Is ${type} ready to capture?`, detail: `There is no ${type} entry yet. Leave it blank if that is accurate.` },
      { title: `A quick ${type} check-in?`, detail: `Nothing is logged for ${type}. Add a meal when it belongs here.` },
    ],
  };
}

function plannedMealRule(type: typeof mealTypes[number], priority: number): SignalRule {
  return {
    id: `meal-${type}-planned`, source: 'meals', family: `meal-${type}`, confidence: .97, priority,
    route: '/(tabs)/meals', action: 'See recipe',
    when: (c) => expectedMeal(c.now) === type && !mealLogged(c, type) && Boolean(plannedMeal(c, type)),
    evidence: (c) => [`${plannedMeal(c, type)?.name} is planned for ${type}`],
    imageUrl: (c) => plannedMeal(c, type)?.imageUrl,
    variants: [
      { title: '{meal}', detail: `Your planned ${type} is the next useful step.` },
      { title: `${sentenceCase(type)} is planned`, detail: '{meal} is ready in today’s meal plan.' },
      { title: `Your ${type} plan is ready`, detail: 'Open {meal} when it is time to cook.' },
    ],
  };
}

function materialize(rule: SignalRule, context: DailySignalContext, day: string): DailySignal {
  const evidence = rule.evidence(context);
  const evidenceHash = stableHash(evidence.join('|'));
  const variantIndex = stableNumber(`${rule.id}:${day}`) % rule.variants.length;
  const variant = rule.variants[variantIndex];
  const replacements: Record<string, string> = {
    workout: context.workout.title ?? 'Today’s workout',
    steps: (context.workout.steps ?? 0).toLocaleString(),
    purchases: String(context.purchaseCount),
    meal: plannedMeal(context)?.name ?? 'Your planned meal',
  };
  const replace = (value: string) => Object.entries(replacements).reduce((copy, [key, replacement]) => copy.replaceAll(`{${key}}`, replacement), value);
  const tentative = rule.confidence < .75;
  const title = replace(variant.title);
  return {
    id: `${rule.id}:${day}:${evidenceHash}`,
    key: `${rule.id}:${day}`,
    source: rule.source,
    kind: rule.source,
    family: rule.family,
    title: tentative && !title.endsWith('?') ? `${title}?` : title,
    detail: replace(variant.detail),
    action: rule.action,
    route: rule.route,
    confidence: rule.confidence,
    priority: rule.priority,
    evidence,
    evidenceHash,
    generatedAt: context.now.toISOString(),
    expiresAt: endOfDay(context.now).toISOString(),
    cooldownKey: rule.id,
    templateId: `${rule.id}:${variantIndex}`,
    requiresConsent: [],
    imageUrl: rule.imageUrl?.(context),
    urgent: rule.urgent,
  };
}

function isSuppressed(signal: DailySignal, interactions: SignalInteraction[], now: Date): boolean {
  return interactions.some((interaction) => {
    const ageDays = (now.getTime() - new Date(interaction.occurredAt).getTime()) / 86_400_000;
    if (interaction.response === 'dismissed' && interaction.family === signal.family && interaction.evidenceHash === signal.evidenceHash && ageDays < 7) return true;
    if (interaction.templateId === signal.templateId && interaction.response === 'shown' && ageDays < 14) return true;
    return false;
  });
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function stableNumber(value: string) {
  return Array.from(value).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;
}

function stableHash(value: string) {
  return stableNumber(value).toString(36);
}

function walkKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [key, ...walkKeys(child)]);
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
