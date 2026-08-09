import type { MoodLabel } from '@/lib/mood';

export type MoodEstimateInput = {
  confirmedMoodHistory: Array<{ label: MoodLabel; at: string }>;
  journal?: { tags: string[]; entryCount: number };
  commitments: { completed: number; scheduled: number };
  movement?: { workoutCompleted: boolean; steps?: number };
  meals?: { loggedMealCount: number; firstLoggedHour?: number; lastLoggedHour?: number };
  ritual: { recentCompletionRate: number };
  localHour: number;
};

export type MoodEstimate = {
  label: MoodLabel;
  confidence: number;
  contributingFamilies: Array<'confirmed_mood' | 'journal' | 'commitments' | 'movement' | 'meals' | 'ritual' | 'time'>;
  explanation: string;
  consentState: 'local_rules' | 'ai_consented';
  userConfirmed: boolean | null;
};

const tagMap: Record<string, MoodLabel> = {
  calm: 'peaceful', grateful: 'joyful', gratitude: 'joyful', focused: 'focused', productive: 'focused',
  tired: 'drained', exhausted: 'drained', anxious: 'anxious', worried: 'anxious', restless: 'restless',
  sad: 'melancholic', tender: 'tender', hopeful: 'hopeful', curious: 'curious', reflective: 'reflective',
};

export function estimateMoodLocally(input: MoodEstimateInput): MoodEstimate | null {
  const scores = new Map<MoodLabel, number>();
  const families = new Set<MoodEstimate['contributingFamilies'][number]>();
  const add = (label: MoodLabel, weight: number, family: MoodEstimate['contributingFamilies'][number]) => {
    scores.set(label, (scores.get(label) ?? 0) + weight);
    families.add(family);
  };

  input.confirmedMoodHistory.slice(-3).forEach((item, index) => add(item.label, .52 - index * .08, 'confirmed_mood'));
  input.journal?.tags.forEach((tag) => {
    const label = tagMap[tag.trim().toLowerCase()];
    if (label) add(label, .5, 'journal');
  });
  const ratio = input.commitments.scheduled ? input.commitments.completed / input.commitments.scheduled : null;
  if (ratio !== null && ratio >= .8) add('grounded', .3, 'commitments');
  if (ratio !== null && ratio <= .34 && input.commitments.scheduled >= 3) add('cloudy', .22, 'commitments');
  if (input.movement?.workoutCompleted) add('energized', .28, 'movement');
  if ((input.movement?.steps ?? 0) >= 8_000) add('energized', .2, 'movement');
  if ((input.meals?.loggedMealCount ?? 0) >= 3) add('grounded', .15, 'meals');
  if (input.ritual.recentCompletionRate >= .75) add('reflective', .15, 'ritual');
  if (input.localHour >= 21) add('reflective', .08, 'time');

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;
  const [label, top] = ranked[0];
  const total = ranked.reduce((sum, [, score]) => sum + score, 0);
  const confidence = Math.min(.92, .42 + (top / Math.max(total, .01)) * .42 + Math.min(families.size, 4) * .025);
  if (confidence < .55) return null;
  return {
    label,
    confidence,
    contributingFamilies: [...families],
    explanation: explanationFor([...families]),
    consentState: 'local_rules',
    userConfirmed: null,
  };
}

function explanationFor(families: MoodEstimate['contributingFamilies']) {
  const names: Record<MoodEstimate['contributingFamilies'][number], string> = {
    confirmed_mood: 'moods you confirmed before', journal: 'your journal tags', commitments: 'today’s commitments',
    movement: 'movement you recorded', meals: 'meal timing', ritual: 'your ritual rhythm', time: 'the time of day',
  };
  const shown = families.slice(0, 3).map((family) => names[family]);
  return `Based on ${shown.join(', ').replace(/, ([^,]*)$/, ' and $1')}. Your Spotify listening is not used for this estimate.`;
}
