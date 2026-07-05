import type { BodyGoal } from '@/lib/nutrition';

export type PlanSlot = {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  note: string;
  recipeId: string;
  imageUrl: string;
  ingredients: string[];
  prepTimeMinutes: number;
  difficulty: 'Easy' | 'Steady' | 'Prep';
  servings: number;
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

export function buildMealPlanWeek(goal: BodyGoal, seed = new Date().toISOString().slice(0, 10)): PlanDay[] {
  const offset = stableIndex(`${seed}:${goal}:meals`, 7);
  return Array.from({ length: 7 }, (_, index) => {
    const dayIndex = (offset + index) % 7;
    const baseDay = buildMealPlanDay(goal, index);
    return {
      breakfast: rotateSlot(baseDay.breakfast, weeklyNames[goal].breakfast[dayIndex], dayIndex, 'breakfast'),
      lunch: rotateSlot(baseDay.lunch, weeklyNames[goal].lunch[(dayIndex + index) % 7], dayIndex, 'lunch'),
      dinner: rotateSlot(baseDay.dinner, weeklyNames[goal].dinner[dayIndex], dayIndex, 'dinner'),
      snacks: baseDay.snacks.map((snack, snackIndex) =>
        rotateSlot(snack, weeklyNames[goal].snack[(dayIndex + snackIndex) % 7], dayIndex, 'snack'),
      ),
      prep: weeklyPrepNotes[dayIndex],
    };
  });
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
  const guide = recipeGuideFor(name, prepSteps);
  return {
    name,
    calories,
    proteinG,
    carbsG: Math.max(8, Math.round((calories * 0.42) / 4)),
    fatG: Math.max(4, Math.round((calories * 0.26) / 9)),
    note,
    recipeId: slugify(name),
    imageUrl: guide.imageUrl,
    ingredients: guide.ingredients,
    prepTimeMinutes: guide.prepTimeMinutes,
    difficulty: guide.difficulty,
    servings: 2,
    prepSteps: guide.prepSteps,
    substitutions,
  };
}

function stableIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}

const weeklyNames: Record<BodyGoal, Record<'breakfast' | 'lunch' | 'dinner' | 'snack', string[]>> = {
  lose: {
    breakfast: ['Greek yoghurt crunch bowl', 'Herb egg scramble toast', 'Cottage cheese tomato toast', 'Berry protein oats', 'Turkey egg breakfast wrap', 'Apple cinnamon yoghurt', 'Spinach omelette plate'],
    lunch: ['Chicken salad grain bowl', 'Turkey crunch wrap', 'Tuna potato lunch box', 'Lemon chicken couscous salad', 'Lean mince lettuce bowl', 'Hummus chicken mezze box', 'Protein soup jar'],
    dinner: ['White fish potato greens', 'Lean mince lettuce bowls', 'Chicken soup bowl', 'Lemon herb chicken tray', 'Turkey chilli rice bowl', 'Hake tacos with slaw', 'Tofu vegetable stir-fry'],
    snack: ['Apple cottage cheese', 'Protein shake', 'Carrots and hummus', 'Boiled eggs and fruit', 'Greek yoghurt cocoa cup', 'Tuna rice cakes', 'Cucumber cottage dip'],
  },
  maintain: {
    breakfast: ['Oats yoghurt berries', 'Eggs toast fruit', 'Breakfast burrito', 'Peanut butter banana oats', 'Savoury cottage toast', 'Berry smoothie bowl', 'Mushroom egg wrap'],
    lunch: ['Chicken rice bowl', 'Tuna pasta salad', 'Chicken couscous salad', 'Turkey avocado sandwich', 'Chickpea feta bowl', 'Pork rice noodle salad', 'Salmon potato lunch box'],
    dinner: ['Salmon couscous vegetables', 'Lean mince potatoes greens', 'Pork rice stir-fry', 'Chicken pesto pasta', 'Beef fajita bowl', 'Hake sweet potato plate', 'Tofu peanut noodle bowl'],
    snack: ['Smoothie', 'Nuts and fruit', 'Yoghurt granola', 'Protein milk and banana', 'Cheese crackers fruit', 'Hummus pita slices', 'Oats protein milk'],
  },
  gain: {
    breakfast: ['Protein oats banana', 'Egg bagel fruit', 'French toast yoghurt', 'Loaded breakfast burrito', 'Chocolate peanut oats', 'Bagel cottage stack', 'Banana oat smoothie bowl'],
    lunch: ['Chicken rice bowl avocado', 'Salmon rice bowl', 'Beef potato bowl', 'Chicken pesto pasta lunch', 'Turkey rice burrito bowl', 'Tuna mayo pasta box', 'Lentil beef chilli bowl'],
    dinner: ['Beef pasta greens', 'Chicken burrito bowl', 'Chicken pesto pasta', 'Salmon potato avocado plate', 'Beef rice noodle bowl', 'Chicken thigh couscous tray', 'Turkey meatball pasta'],
    snack: ['Peanut butter smoothie', 'Trail mix', 'Banana oat shake', 'Greek yoghurt granola', 'Protein milk', 'Cheese crackers fruit', 'Dates peanut butter toast'],
  },
};

const weeklyPrepNotes = [
  'Batch one protein and one grain; keep sauces separate.',
  'Cook once, assemble fresh so texture stays good.',
  'Prep chopped vegetables ahead and finish the protein fresh.',
  'Use leftovers as lunch, then cook dinner fresh.',
  'Keep a quick snack ready before appetite dips.',
  'Make the flexible base first, then season per meal.',
  'Reset containers and prep the first two days of next week.',
];

function rotateSlot(slot: PlanSlot, name: string, index: number, role: 'breakfast' | 'lunch' | 'dinner' | 'snack'): PlanSlot {
  const guide = recipeGuideFor(name, slot.prepSteps ?? []);
  const calorieShift = role === 'snack' ? (index % 2) * 20 : (index % 3) * 30;
  const calories = slot.calories + calorieShift;
  return {
    ...slot,
    name,
    calories,
    proteinG: slot.proteinG + (role === 'dinner' && index % 2 === 0 ? 2 : 0),
    carbsG: Math.max(8, Math.round((calories * 0.42) / 4)),
    fatG: Math.max(4, Math.round((calories * 0.26) / 9)),
    note: guideNoteFor(role, slot.note, index),
    recipeId: slugify(name),
    imageUrl: guide.imageUrl,
    ingredients: guide.ingredients,
    prepTimeMinutes: guide.prepTimeMinutes,
    difficulty: guide.difficulty,
    servings: role === 'snack' ? 1 : 2,
    prepSteps: guide.prepSteps,
  };
}

function recipeGuideFor(name: string, starterSteps: string[]) {
  const text = name.toLowerCase();
  const imageUrl = imageFor(text);
  const ingredients = ingredientsFor(text);
  const prepSteps = stepsFor(text, starterSteps, ingredients);
  const prepTimeMinutes = text.includes('smoothie') || text.includes('shake') ? 10 : text.includes('bowl') ? 20 : text.includes('tray') || text.includes('pasta') ? 35 : 25;
  const difficulty: PlanSlot['difficulty'] = prepTimeMinutes <= 15 ? 'Easy' : prepTimeMinutes >= 30 ? 'Prep' : 'Steady';

  return { imageUrl, ingredients, prepSteps, prepTimeMinutes, difficulty };
}

function ingredientsFor(text: string) {
  if (text.includes('salmon')) return ['salmon fillet', 'couscous or potatoes', 'green vegetables', 'lemon', 'olive oil'];
  if (text.includes('fish') || text.includes('hake')) return ['white fish fillet', 'potatoes', 'slaw or greens', 'lemon', 'yoghurt sauce'];
  if (text.includes('chicken')) return ['chicken breast or thighs', 'rice or couscous', 'greens', 'sauce', 'herbs'];
  if (text.includes('beef') || text.includes('mince')) return ['lean beef or mince', 'rice, pasta, or potatoes', 'tomato base', 'greens', 'spices'];
  if (text.includes('turkey')) return ['turkey slices or mince', 'wrap or rice', 'salad vegetables', 'yoghurt sauce', 'herbs'];
  if (text.includes('tuna')) return ['tuna', 'potatoes or pasta', 'yoghurt dressing', 'cucumber', 'lemon'];
  if (text.includes('tofu') || text.includes('chickpea') || text.includes('lentil')) return ['tofu or legumes', 'rice or noodles', 'mixed vegetables', 'sauce', 'sesame or herbs'];
  if (text.includes('oat') || text.includes('yoghurt') || text.includes('smoothie') || text.includes('shake')) return ['Greek yoghurt or milk', 'oats', 'fruit', 'protein powder', 'seeds or nut butter'];
  if (text.includes('egg') || text.includes('omelette') || text.includes('burrito')) return ['eggs', 'toast or wrap', 'spinach', 'tomato', 'cheese or avocado'];
  return ['protein base', 'carb base', 'vegetables', 'sauce', 'seasoning'];
}

function stepsFor(text: string, starterSteps: string[], ingredients: string[]) {
  if (text.includes('smoothie') || text.includes('shake')) {
    return ['Add liquid, fruit, and protein to the blender.', 'Blend until smooth, adding ice or oats to adjust texture.', 'Pour into a bottle and chill if saving for later.'];
  }
  if (text.includes('oat') || text.includes('yoghurt')) {
    return ['Build the yoghurt or oat base first.', `Add ${ingredients[2]} and keep crunchy toppings separate.`, 'Pack chilled and stir just before eating.'];
  }
  if (text.includes('pasta')) {
    return ['Cook pasta until just tender and reserve a little pasta water.', `Cook ${ingredients[0]} with seasoning until browned.`, 'Fold through sauce, vegetables, and pasta water until glossy.'];
  }
  if (text.includes('tray')) {
    return ['Heat the oven and spread the carb base on a tray.', `Season ${ingredients[0]} and add it beside the vegetables.`, 'Roast until cooked through, then finish with herbs or lemon.'];
  }
  if (starterSteps.length >= 3) return starterSteps;
  return [...starterSteps, 'Pack sauce separately and season again before serving.'].slice(0, 3);
}

function imageFor(text: string) {
  if (text.includes('salmon')) return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop';
  if (text.includes('chicken')) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop';
  if (text.includes('oat') || text.includes('yoghurt')) return 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&auto=format&fit=crop';
  if (text.includes('smoothie') || text.includes('shake')) return 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop';
  if (text.includes('beef') || text.includes('pasta')) return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop';
  if (text.includes('fish') || text.includes('hake')) return 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&auto=format&fit=crop';
  if (text.includes('egg')) return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop';
  return 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=600&auto=format&fit=crop';
}

function guideNoteFor(role: 'breakfast' | 'lunch' | 'dinner' | 'snack', fallback: string, index: number) {
  const notes = {
    breakfast: ['Quick start', 'Steady energy', 'Prep-ahead breakfast'],
    lunch: ['Portable lunch', 'Batch-friendly', 'Good cold or warm'],
    dinner: ['Fresh cook', 'Family-style dinner', 'Leftover-friendly'],
    snack: ['Protein bridge', 'Easy top-up', 'Packable snack'],
  };
  return notes[role][index % notes[role].length] ?? fallback;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
