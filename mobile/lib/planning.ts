import type { BodyGoal } from '@/lib/nutrition';

export type PlanSlot = {
  name: string;
  calories: number;
  proteinG: number;
  note: string;
  recipeId?: string;
  substitutions?: string[];
  prepSteps?: string[];
};

export type PlanDay = {
  breakfast: PlanSlot;
  lunch: PlanSlot;
  dinner: PlanSlot;
  snacks: PlanSlot[];
  prep: string;
};

export type WorkoutCategory = 'calisthenics' | 'cardio' | 'cycling' | 'gym';
export type WorkoutLevel = 'beginner' | 'steady' | 'advanced';

const mealTemplates: Record<BodyGoal, PlanDay[]> = {
  lose: [
    day(
      slot('Greek yoghurt, berries, chia', 360, 32, 'High protein, high volume', ['Portion yoghurt into a bowl.', 'Top with berries, oats, and chia just before eating.'], ['Swap chia for flax']),
      slot('Chicken salad grain bowl', 520, 44, 'Lean protein, measured dressing', ['Cook chicken in a batch.', 'Build the bowl with greens, grain, and dressing on the side.'], ['Swap chicken for tuna or tofu']),
      slot('White fish, potatoes, greens', 560, 42, 'Filling plate, lighter fats', ['Roast potatoes until crisp.', 'Pan-cook fish and steam greens while potatoes finish.'], ['Swap fish for chicken breast']),
      [slot('Apple + cottage cheese', 220, 18, 'Protein bridge', ['Slice apple.', 'Serve with cottage cheese and cinnamon.'], ['Swap cottage cheese for Greek yoghurt'])],
      'Prep lean proteins and crunchy sides first; keep sauces measured.',
    ),
    day(
      slot('Egg scramble + toast', 390, 30, 'Steady start', ['Whisk eggs with salt and herbs.', 'Scramble slowly and serve with toast.'], ['Swap toast for potatoes']),
      slot('Turkey wrap + salad', 500, 38, 'Portable and controlled', ['Warm the wrap briefly.', 'Layer turkey, salad, and sauce before rolling tight.'], ['Swap turkey for chicken strips']),
      slot('Lean mince lettuce bowls', 570, 46, 'Big volume, simple carbs', ['Brown mince with spices.', 'Spoon into lettuce cups with rice or potatoes.'], ['Swap mince for lentils']),
      [slot('Protein shake', 180, 25, 'Low-friction protein', ['Add water or milk to shaker.', 'Shake with protein powder until smooth.'], ['Swap for protein milk'])],
      'Keep snacks pre-portioned so the deficit does not become guesswork.',
    ),
    day(
      slot('Cottage cheese toast', 340, 31, 'Light but filling', ['Toast bread until firm.', 'Top with cottage cheese, tomato, and pepper.'], ['Swap toast for rice cakes']),
      slot('Tuna potato box', 510, 43, 'Easy cold lunch', ['Boil potatoes ahead.', 'Mix tuna with yoghurt, herbs, and lemon.'], ['Swap tuna for chicken']),
      slot('Chicken soup bowl', 540, 45, 'Warm high-volume dinner', ['Simmer stock, vegetables, and shredded chicken.', 'Add noodles or rice near the end.'], ['Swap noodles for beans']),
      [slot('Carrots + hummus', 190, 8, 'Crunchy snack', ['Cut carrots into sticks.', 'Portion hummus into a small tub.'], ['Swap carrots for cucumber'])],
      'Use broth, crunchy vegetables, and lean protein to keep meals full without getting heavy.',
    ),
  ],
  maintain: [
    day(
      slot('Oats, yoghurt, berries', 460, 30, 'Balanced base', ['Cook oats with milk or water.', 'Top with yoghurt and berries after cooking.'], ['Swap berries for banana']),
      slot('Chicken rice bowl', 650, 44, 'Steady workday fuel', ['Batch rice and chicken.', 'Add greens and a sauce only when serving.'], ['Swap rice for couscous']),
      slot('Salmon, couscous, vegetables', 640, 42, 'Protein + fats + color', ['Cook couscous with stock.', 'Sear salmon and serve with vegetables.'], ['Swap salmon for hake']),
      [slot('Smoothie', 320, 24, 'Flexible top-up', ['Blend fruit, milk, and protein.', 'Add oats if the day needs more energy.'], ['Swap milk for yoghurt'])],
      'Prep two flexible bases and rotate sauces for variety.',
    ),
    day(
      slot('Eggs, toast, fruit', 470, 28, 'Simple and repeatable', ['Cook eggs to preference.', 'Serve with toast and fruit.'], ['Swap toast for oats']),
      slot('Tuna pasta salad', 620, 40, 'Carbs for the middle of the day', ['Cook pasta and cool it.', 'Fold through tuna, vegetables, and dressing.'], ['Swap tuna for chicken']),
      slot('Lean mince, potatoes, greens', 670, 48, 'Comfortable maintenance plate', ['Roast potatoes.', 'Brown mince and steam greens.'], ['Swap potatoes for rice']),
      [slot('Nuts + fruit', 280, 8, 'Energy without a full meal', ['Portion nuts.', 'Pair with a piece of fruit.'], ['Swap nuts for granola'])],
      'Keep portions steady and let ingredients change.',
    ),
    day(
      slot('Breakfast burrito', 520, 33, 'Warm balanced start', ['Scramble eggs and beans.', 'Wrap with salsa and a little cheese.'], ['Swap wrap for toast']),
      slot('Chicken couscous salad', 610, 42, 'Bright lunch', ['Fluff couscous.', 'Add chicken, cucumber, herbs, and lemon.'], ['Swap chicken for chickpeas']),
      slot('Pork rice stir-fry', 690, 45, 'Fast evening plate', ['Cook pork strips hot and fast.', 'Add rice and vegetables at the end.'], ['Swap pork for tofu']),
      [slot('Yoghurt + granola', 300, 20, 'Easy snack', ['Spoon yoghurt into a bowl.', 'Top with granola just before eating.'], ['Swap granola for oats'])],
      'Prep one cooked grain, one protein, and one chopped vegetable mix.',
    ),
  ],
  gain: [
    day(
      slot('Protein oats + banana', 620, 38, 'Dense breakfast', ['Cook oats with milk.', 'Stir in protein after cooling slightly and top with banana.'], ['Swap banana for berries and honey']),
      slot('Chicken rice bowl + avocado', 820, 52, 'Carb-forward meal', ['Batch chicken and rice.', 'Add avocado and sauce when serving.'], ['Swap avocado for olive oil dressing']),
      slot('Beef pasta + greens', 860, 55, 'Big dinner, simple prep', ['Cook pasta and reserve water.', 'Brown beef, fold through sauce, then add greens.'], ['Swap beef for turkey mince']),
      [
        slot('Peanut butter smoothie', 520, 32, 'Easy calories', ['Blend milk, banana, oats, peanut butter, and protein.', 'Split into two servings if appetite is low.'], ['Swap peanut butter for tahini']),
        slot('Greek yoghurt + granola', 360, 24, 'Evening top-up', ['Spoon yoghurt into a bowl.', 'Add granola and honey.'], ['Swap granola for cereal']),
      ],
      'Batch a protein base, dense carb, and sauce so eating enough stays easy.',
    ),
    day(
      slot('Egg bagel + fruit', 650, 34, 'Higher-carb start', ['Toast bagel.', 'Fill with eggs and serve fruit on the side.'], ['Swap bagel for sourdough']),
      slot('Salmon rice bowl', 790, 46, 'Protein with energy', ['Cook rice.', 'Add salmon, vegetables, and sauce.'], ['Swap salmon for chicken thighs']),
      slot('Chicken burrito bowl', 900, 58, 'Dense but structured', ['Warm rice and beans.', 'Top with chicken, salsa, avocado, and cheese.'], ['Swap chicken for beef strips']),
      [
        slot('Trail mix', 360, 10, 'Pocket calories', ['Portion trail mix into a tub.', 'Pair with water so it is easy to finish.'], ['Swap nuts for cereal mix']),
        slot('Protein milk', 260, 30, 'Before bed', ['Chill protein milk.', 'Drink it as the final planned snack.'], ['Swap for a shake']),
      ],
      'Add one planned snack before hunger decides for you.',
    ),
    day(
      slot('French toast + yoghurt', 680, 36, 'Comfortable surplus', ['Soak bread in egg mixture.', 'Cook until golden and serve with yoghurt.'], ['Swap yoghurt for cottage cheese']),
      slot('Beef potato bowl', 840, 50, 'Dense lunch', ['Roast potatoes.', 'Add beef, vegetables, and sauce.'], ['Swap potatoes for rice']),
      slot('Chicken pesto pasta', 920, 60, 'Easy high-calorie dinner', ['Cook pasta.', 'Fold through chicken, pesto, and vegetables.'], ['Swap pesto for tomato cream sauce']),
      [
        slot('Banana oat shake', 480, 28, 'Drinkable top-up', ['Blend oats, banana, milk, and protein.', 'Add ice if drinking after training.'], ['Swap banana for dates']),
        slot('Cheese crackers + fruit', 340, 16, 'Simple snack', ['Portion cheese and crackers.', 'Add fruit for carbs.'], ['Swap crackers for toast']),
      ],
      'Use drinkable calories and easy snacks so the surplus does not feel like a chore.',
    ),
  ],
};

const workoutTemplates: Record<WorkoutCategory, Record<WorkoutLevel, string[]>> = {
  calisthenics: {
    beginner: ['Push + core basics', 'Legs + mobility', 'Pull pattern practice', 'Full-body flow', 'Walk + stretch reset', 'Core control'],
    steady: ['Tempo push strength', 'Single-leg control', 'Pull + posterior chain', 'Conditioning circuit', 'Skill balance practice', 'Mobility strength blend'],
    advanced: ['Density push session', 'Pistol progression', 'Pull volume ladder', 'Explosive full body', 'Skill endurance circuit', 'Core compression'],
  },
  cardio: {
    beginner: ['Easy run-walk', 'Incline walk intervals', 'Zone 2 base', 'Recovery walk', 'Short hill walk', 'Breath-paced jog'],
    steady: ['Tempo intervals', 'Long zone 2 run', 'Fartlek session', 'Hill repeats', 'Progression run', 'Recovery aerobic walk'],
    advanced: ['Threshold repeats', 'Long aerobic build', 'VO2 interval set', 'Hill sprint session', 'Tempo progression', 'Easy flush run'],
  },
  cycling: {
    beginner: ['Easy spin', 'Cadence practice', 'Endurance ride', 'Gentle hill repeats', 'Recovery roll', 'Bike handling loop'],
    steady: ['Sweet spot blocks', 'Hill repeat ride', 'Tempo endurance', 'Cadence ladder', 'Long steady ride', 'Recovery spin'],
    advanced: ['VO2 climb repeats', 'Long endurance ride', 'Over-under intervals', 'Sprint cadence set', 'Threshold tempo ride', 'Recovery spin'],
  },
  gym: {
    beginner: ['Upper body foundation', 'Lower body foundation', 'Full-body machines', 'Dumbbell technique', 'Core + carry session', 'Posterior chain basics'],
    steady: ['Push strength', 'Pull strength', 'Leg hypertrophy', 'Upper volume', 'Full-body conditioning', 'Hinge + core'],
    advanced: ['Heavy upper strength', 'Heavy lower strength', 'Push volume', 'Pull volume', 'Full-body power', 'Posterior chain intensity'],
  },
};

export function buildMealPlanDay(goal: BodyGoal, index: number): PlanDay {
  const options = mealTemplates[goal];
  return options[index % options.length];
}

export function buildWorkoutDays(category: WorkoutCategory, level: WorkoutLevel, seed = new Date().toISOString().slice(0, 10)): string[] {
  const volume = level === 'advanced' ? 5 : level === 'steady' ? 4 : 3;
  const sessions = workoutTemplates[category][level];
  const offset = stableIndex(`${seed}:${category}:${level}`, sessions.length);
  return Array.from({ length: volume }, (_, index) => sessions[(offset + index) % sessions.length]);
}

function day(breakfast: PlanSlot, lunch: PlanSlot, dinner: PlanSlot, snacks: PlanSlot[], prep: string): PlanDay {
  return { breakfast, lunch, dinner, snacks, prep };
}

function slot(
  name: string,
  calories: number,
  proteinG: number,
  note: string,
  prepSteps: string[],
  substitutions: string[],
): PlanSlot {
  return { name, calories, proteinG, note, prepSteps, substitutions };
}

function stableIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}
