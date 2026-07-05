import type { IconName } from '@/components/ui/Icon';

const iconRules: Array<{ icon: IconName; terms: string[] }> = [
  { icon: 'water', terms: ['water', 'hydrate', 'hydration'] },
  { icon: 'book', terms: ['read', 'book', 'pages'] },
  { icon: 'journal', terms: ['write', 'journal', 'line', 'reflect', 'priority', 'plan'] },
  { icon: 'money', terms: ['money', 'expense', 'spend', 'budget', 'saving'] },
  { icon: 'home', terms: ['room', 'home', 'dishes', 'clean', 'reset'] },
  { icon: 'clock', terms: ['sleep', 'bed', 'wind down', 'screen-off', 'night'] },
  { icon: 'health', terms: ['walk', 'workout', 'move', 'stretch', 'run', 'gym', 'body'] },
  { icon: 'meals', terms: ['meal', 'food', 'protein', 'breakfast', 'lunch', 'dinner'] },
  { icon: 'sparkles', terms: ['breath', 'kind', 'message', 'mind', 'calm'] },
];

export function getHabitIconName(habitName: string): IconName {
  const normalized = habitName.trim().toLowerCase();
  const rule = iconRules.find((item) => item.terms.some((term) => normalized.includes(term)));
  return rule?.icon ?? 'sparkles';
}
