export type DailyFocusTone = 'gentle' | 'direct' | 'coach' | 'minimal';

export type DailyFocusContext = {
  displayName?: string | null;
  toneProfile?: DailyFocusTone;
  completedHabits: number;
  totalHabits: number;
  proteinRemaining: number;
  ritualDone: boolean;
};

const gentleNotes = [
  'Keep today small and kind. One honest action is enough to change the shape of the day.',
  'You do not need a perfect streak today. You need one clear next step and a little patience.',
  'Let the day be simple: water, movement, food, and one moment where you tell yourself the truth.',
  'A quiet win still counts. Choose the next thing that makes tonight feel easier.',
  'No rush. Build the kind of day your future self can exhale inside.',
];

const directNotes = [
  'Pick the next useful action and do it before the day gets noisy.',
  'Keep the promise small enough to finish. Finished beats dramatic.',
  'Do the basics early: eat enough, move a little, and close one open loop.',
  'Do not negotiate with the whole day. Win the next ten minutes.',
  'Make the useful choice visible, then make it easy.',
];

const coachNotes = [
  'Today is a reps day. Stack one habit, one meal, one reset, and let momentum do its work.',
  'Aim for clean effort, not maximum effort. The plan works when you can repeat it.',
  'Your job is to make the next good choice obvious and boring enough to complete.',
  'Treat today like practice: show up, adjust, and keep the bar reachable.',
  'Small consistency compounds. Put one more brick in place today.',
];

const minimalNotes = [
  'One clear step. Then the next.',
  'Keep it light. Keep it moving.',
  'Do the small true thing.',
  'Less noise. More follow-through.',
  'Start where you are.',
];

export function getDailyFocusNote(dateIso: string, context: DailyFocusContext) {
  const tone = context.toneProfile ?? 'gentle';
  const baseNotes = tone === 'direct' ? directNotes : tone === 'coach' ? coachNotes : tone === 'minimal' ? minimalNotes : gentleNotes;
  const contextNotes = buildContextNotes(context);
  const notes = [...contextNotes, ...baseNotes];
  return notes[stableIndex(`${dateIso}:${tone}:${context.totalHabits}:${context.ritualDone}`, notes.length)];
}

function buildContextNotes(context: DailyFocusContext) {
  const name = context.displayName?.trim();
  const prefix = name ? `${name}, ` : '';
  const notes: string[] = [];

  if (!context.ritualDone) {
    notes.push(`${prefix}leave a little space for tonight. The ritual only needs a few honest minutes.`);
  }

  if (context.totalHabits > 0 && context.completedHabits === 0) {
    notes.push(`${prefix}start with the smallest habit on the list. Opening the loop is the win.`);
  }

  if (context.totalHabits > 0 && context.completedHabits >= context.totalHabits) {
    notes.push(`${prefix}you have already closed the habit loop. Let the rest of today stay steady.`);
  }

  if (context.proteinRemaining >= 30) {
    notes.push(`${prefix}anchor the next meal with protein first, then let the rest of the plate be easy.`);
  }

  return notes;
}

function stableIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}
