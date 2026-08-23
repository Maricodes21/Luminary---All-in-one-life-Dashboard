import type { MoodLabel } from './mood';

export type ListeningReaction =
  | 'lifted'
  | 'energized'
  | 'focused'
  | 'comforted'
  | 'reflective'
  | 'did_not_match';

export const listeningReactionOptions: Array<{
  value: ListeningReaction;
  label: string;
  moodHint: MoodLabel | null;
}> = [
  { value: 'lifted', label: 'It lifted me', moodHint: 'joyful' },
  { value: 'energized', label: 'It kept me moving', moodHint: 'energized' },
  { value: 'focused', label: 'It helped me focus', moodHint: 'focused' },
  { value: 'comforted', label: 'It felt comforting', moodHint: 'grounded' },
  { value: 'reflective', label: 'It made me reflective', moodHint: 'reflective' },
  { value: 'did_not_match', label: 'It did not match my day', moodHint: null },
];

export function moodHintForListeningReaction(reaction: ListeningReaction | null | undefined) {
  return listeningReactionOptions.find((option) => option.value === reaction)?.moodHint ?? null;
}

export function listeningReactionLabel(reaction: ListeningReaction | null | undefined) {
  return listeningReactionOptions.find((option) => option.value === reaction)?.label ?? null;
}

export type PersonalizationContext = {
  localDate: string;
  localHour: number;
  listeningReaction?: ListeningReaction;
  confirmedMoodHistory: Array<{ label: MoodLabel; at: string }>;
  journal?: { tags: string[]; entryCount: number; recentText?: string[] };
  commitments: { completed: number; scheduled: number };
  movement?: { workoutCompleted: boolean; sessionTitle?: string };
  meals?: { loggedMealCount: number };
  ritual: { recentCompletionRate: number };
};

export type NightlyReflection = {
  id: string;
  localDate: string;
  generatedAt: string;
  model: string;
  theme: string;
  reflection: string;
  question: string;
  evidenceCategories: string[];
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
};
