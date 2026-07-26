export type WorkoutCategory = 'calisthenics' | 'cardio' | 'cycling' | 'gym';
export type WorkoutLevel = 'beginner' | 'steady' | 'advanced';

export type PlannedExercise = {
  id: string;
  name: string;
  prescription: string;
  cue: string;
  equipment: string[];
  imageUrl: string;
  alternatives: string[];
};

export type WorkoutSession = {
  id: string;
  title: string;
  focus: string;
  durationMinutes: number;
  warmup: string;
  exercises: PlannedExercise[];
  cooldown: string;
  progression: string;
};

export type WorkoutPlanInput = {
  category: WorkoutCategory;
  level: WorkoutLevel;
  durationMinutes: number;
  seed?: string;
};

type FocusTemplate = { title: string; focus: string[] };
type Movement = {
  id: string;
  name: string;
  category: WorkoutCategory;
  minLevel: WorkoutLevel;
  focus: string[];
  equipment: string[];
  reps: Record<WorkoutLevel, string>;
  cue: string;
  imageUrl: string;
};

const strengthImage = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop';
const bodyweightImage = 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&auto=format&fit=crop';
const runImage = 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=400&auto=format&fit=crop';
const bikeImage = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop';

const focusTemplates: Record<WorkoutCategory, FocusTemplate[]> = {
  gym: [
    { title: 'Hinge + core', focus: ['hinge', 'core'] },
    { title: 'Push strength', focus: ['push', 'core'] },
    { title: 'Pull strength', focus: ['pull', 'carry'] },
    { title: 'Leg strength', focus: ['squat', 'legs'] },
    { title: 'Upper volume', focus: ['push', 'pull'] },
    { title: 'Full-body power', focus: ['hinge', 'squat', 'push', 'pull'] },
  ],
  calisthenics: [
    { title: 'Push + core', focus: ['push', 'core'] },
    { title: 'Legs + mobility', focus: ['squat', 'legs'] },
    { title: 'Pull + posterior', focus: ['pull', 'hinge'] },
    { title: 'Full-body control', focus: ['push', 'pull', 'legs', 'core'] },
    { title: 'Skill + conditioning', focus: ['skill', 'conditioning', 'core'] },
    { title: 'Mobility strength', focus: ['mobility', 'hinge', 'core'] },
  ],
  cardio: [
    { title: 'Aerobic base', focus: ['base', 'technique'] },
    { title: 'Speed intervals', focus: ['speed', 'recovery'] },
    { title: 'Hill strength', focus: ['hills', 'technique'] },
    { title: 'Progression run', focus: ['base', 'tempo'] },
    { title: 'Recovery aerobic', focus: ['recovery', 'mobility'] },
    { title: 'Threshold build', focus: ['tempo', 'speed'] },
  ],
  cycling: [
    { title: 'Endurance ride', focus: ['base', 'technique'] },
    { title: 'Cadence ladder', focus: ['cadence', 'recovery'] },
    { title: 'Hill repeat ride', focus: ['hills', 'strength'] },
    { title: 'Tempo endurance', focus: ['base', 'tempo'] },
    { title: 'Recovery spin', focus: ['recovery', 'mobility'] },
    { title: 'Over-under intervals', focus: ['tempo', 'speed'] },
  ],
};

const movements: Movement[] = [
  movement('gym_kettlebell_deadlift', 'Kettlebell deadlift', 'gym', 'beginner', ['hinge'], ['dumbbell'], ['8–10 reps', '8–12 reps', '6–8 reps'], 'Brace before the weight leaves the floor.', strengthImage),
  movement('gym_hip_thrust', 'Hip thrust', 'gym', 'beginner', ['hinge', 'legs'], ['machine', 'barbell'], ['10 reps', '8–12 reps', '6–10 reps'], 'Finish with the ribs stacked over the pelvis.', strengthImage),
  movement('gym_romanian_deadlift', 'Romanian deadlift', 'gym', 'steady', ['hinge'], ['dumbbells', 'barbell'], ['8 reps', '8–10 reps', '6–8 reps'], 'Push the hips back and keep the weight close.', strengthImage),
  movement('gym_trap_bar_deadlift', 'Trap-bar deadlift', 'gym', 'steady', ['hinge', 'legs'], ['barbell'], ['6 reps', '5–8 reps', '3–6 reps'], 'Drive through the floor without rushing the start.', strengthImage),
  movement('gym_barbell_deadlift', 'Barbell deadlift', 'gym', 'advanced', ['hinge'], ['barbell'], ['5 reps', '4–6 reps', '3–5 reps'], 'Brace, remove the slack, then push the floor away.', strengthImage),
  movement('gym_goblet_squat', 'Goblet squat', 'gym', 'beginner', ['squat', 'legs'], ['dumbbell'], ['8–10 reps', '10–12 reps', '8–10 reps'], 'Keep the whole foot connected to the floor.', strengthImage),
  movement('gym_leg_press', 'Leg press', 'gym', 'beginner', ['squat', 'legs'], ['machine'], ['10 reps', '10–15 reps', '8–12 reps'], 'Lower only as far as the pelvis stays settled.', strengthImage),
  movement('gym_leg_curl', 'Seated leg curl', 'gym', 'beginner', ['hinge', 'legs'], ['machine'], ['10 reps', '10–15 reps', '8–12 reps'], 'Keep the hips heavy as the heels curl underneath.', strengthImage),
  movement('gym_split_squat', 'Dumbbell split squat', 'gym', 'steady', ['squat', 'legs'], ['dumbbells'], ['8 each side', '8–10 each side', '6–10 each side'], 'Stay tall and let the front knee travel naturally.', strengthImage),
  movement('gym_back_squat', 'Barbell back squat', 'gym', 'steady', ['squat', 'legs'], ['barbell'], ['6 reps', '6–8 reps', '4–6 reps'], 'Brace before every descent.', strengthImage),
  movement('gym_front_squat', 'Front squat', 'gym', 'advanced', ['squat', 'legs'], ['barbell'], ['5 reps', '5–8 reps', '3–6 reps'], 'Drive the elbows up as you stand.', strengthImage),
  movement('gym_walking_lunge', 'Dumbbell walking lunge', 'gym', 'steady', ['squat', 'legs'], ['dumbbells'], ['6 each side', '10 each side', '12 each side'], 'Step softly and own the balance before the next rep.', strengthImage),
  movement('gym_machine_press', 'Machine chest press', 'gym', 'beginner', ['push'], ['machine'], ['8–10 reps', '10–12 reps', '8–10 reps'], 'Keep the shoulder blades supported.', strengthImage),
  movement('gym_dumbbell_bench', 'Dumbbell bench press', 'gym', 'beginner', ['push'], ['dumbbells'], ['8 reps', '8–12 reps', '6–10 reps'], 'Lower with control and press without shrugging.', strengthImage),
  movement('gym_incline_press', 'Incline dumbbell press', 'gym', 'steady', ['push'], ['dumbbells'], ['8 reps', '8–10 reps', '6–8 reps'], 'Keep the elbows under the wrists.', strengthImage),
  movement('gym_overhead_press', 'Standing overhead press', 'gym', 'steady', ['push'], ['barbell', 'dumbbells'], ['6 reps', '6–10 reps', '4–8 reps'], 'Squeeze the glutes and finish overhead, not behind you.', strengthImage),
  movement('gym_machine_shoulder_press', 'Machine shoulder press', 'gym', 'beginner', ['push'], ['machine'], ['8 reps', '10–12 reps', '8–10 reps'], 'Keep the ribs down as the handles travel overhead.', strengthImage),
  movement('gym_lateral_raise', 'Dumbbell lateral raise', 'gym', 'steady', ['push'], ['dumbbells'], ['10 reps', '12–15 reps', '10–15 reps'], 'Lift with relaxed traps and controlled elbows.', strengthImage),
  movement('gym_bench_press', 'Barbell bench press', 'gym', 'advanced', ['push'], ['barbell'], ['6 reps', '5–8 reps', '3–6 reps'], 'Set the upper back before unracking.', strengthImage),
  movement('gym_lat_pulldown', 'Lat pulldown', 'gym', 'beginner', ['pull'], ['machine'], ['10 reps', '8–12 reps', '6–10 reps'], 'Pull the elbows toward the ribs.', strengthImage),
  movement('gym_cable_row', 'Seated cable row', 'gym', 'beginner', ['pull'], ['machine'], ['10 reps', '10–12 reps', '8–10 reps'], 'Pause at the ribs without leaning back.', strengthImage),
  movement('gym_dumbbell_row', 'One-arm dumbbell row', 'gym', 'beginner', ['pull'], ['dumbbell'], ['8 each side', '8–12 each side', '6–10 each side'], 'Keep the torso quiet as the elbow travels back.', strengthImage),
  movement('gym_pull_up', 'Pull-up', 'gym', 'steady', ['pull'], ['bodyweight'], ['4–6 reps', '6–10 reps', 'weighted 4–8 reps'], 'Start from a long arm and drive the elbows down.', strengthImage),
  movement('gym_barbell_row', 'Barbell row', 'gym', 'steady', ['pull'], ['barbell'], ['6 reps', '6–10 reps', '5–8 reps'], 'Hold the hinge and row toward the lower ribs.', strengthImage),
  movement('gym_chest_supported_row', 'Chest-supported row', 'gym', 'advanced', ['pull'], ['machine', 'dumbbells'], ['8 reps', '8–12 reps', '6–10 reps'], 'Let the shoulder blades move, then finish the pull.', strengthImage),
  movement('gym_face_pull', 'Cable face pull', 'gym', 'beginner', ['pull'], ['machine'], ['10 reps', '12–15 reps', '12–20 reps'], 'Pull toward eye level and rotate the hands apart.', strengthImage),
  movement('gym_dead_bug', 'Dead bug', 'gym', 'beginner', ['core'], ['bodyweight'], ['6 each side', '8 each side', '10 each side'], 'Exhale and keep the lower back heavy.', strengthImage),
  movement('gym_pallof_press', 'Pallof press', 'gym', 'beginner', ['core'], ['machine', 'bands'], ['8 each side', '10 each side', '12 each side'], 'Do not let the cable rotate you.', strengthImage),
  movement('gym_hanging_knee_raise', 'Hanging knee raise', 'gym', 'steady', ['core'], ['bodyweight'], ['6 reps', '8–12 reps', '10–15 reps'], 'Curl the pelvis instead of swinging the legs.', strengthImage),
  movement('gym_ab_wheel', 'Ab-wheel rollout', 'gym', 'advanced', ['core'], ['bodyweight'], ['5 reps', '6–10 reps', '8–12 reps'], 'Keep the ribs down as the arms travel forward.', strengthImage),
  movement('gym_farmer_carry', 'Farmer carry', 'gym', 'beginner', ['carry', 'core'], ['dumbbells'], ['3 × 20 m', '3 × 30 m', '4 × 30 m'], 'Walk tall without letting the weights pull you sideways.', strengthImage),
  movement('gym_woodchop', 'Cable woodchop', 'gym', 'steady', ['core'], ['machine'], ['8 each side', '10 each side', '12 each side'], 'Turn through the upper back while the hips stay controlled.', strengthImage),

  movement('home_wall_pushup', 'Wall push-up', 'calisthenics', 'beginner', ['push'], ['bodyweight'], ['8–12 reps', '12–15 reps', '15–20 reps'], 'Move the chest and hips as one unit.', bodyweightImage),
  movement('home_incline_pushup', 'Incline push-up', 'calisthenics', 'beginner', ['push'], ['bodyweight'], ['6–10 reps', '10–15 reps', '12–20 reps'], 'Choose a height that keeps every rep clean.', bodyweightImage),
  movement('home_knee_pushup', 'Kneeling push-up', 'calisthenics', 'beginner', ['push'], ['bodyweight'], ['6–10 reps', '10–15 reps', '15–20 reps'], 'Keep a straight line from knees through shoulders.', bodyweightImage),
  movement('home_pushup', 'Push-up', 'calisthenics', 'steady', ['push'], ['bodyweight'], ['5–8 reps', '8–15 reps', '12–20 reps'], 'Keep the ribs tucked and elbows comfortably angled.', bodyweightImage),
  movement('home_pike_pushup', 'Pike push-up', 'calisthenics', 'advanced', ['push', 'skill'], ['bodyweight'], ['4–6 reps', '6–10 reps', '8–12 reps'], 'Send the crown of the head between the hands.', bodyweightImage),
  movement('home_decline_pushup', 'Decline push-up', 'calisthenics', 'advanced', ['push'], ['bodyweight'], ['5 reps', '8 reps', '8–15 reps'], 'Stay long through the body as the chest lowers.', bodyweightImage),
  movement('home_diamond_pushup', 'Diamond push-up', 'calisthenics', 'advanced', ['push'], ['bodyweight'], ['4 reps', '6–8 reps', '8–15 reps'], 'Keep the shoulders away from the ears as the elbows bend.', bodyweightImage),
  movement('home_band_row', 'Band row', 'calisthenics', 'beginner', ['pull'], ['bands'], ['10 reps', '12–15 reps', '15–20 reps'], 'Pull the elbows toward the back pockets.', bodyweightImage),
  movement('home_towel_row', 'Towel isometric row', 'calisthenics', 'beginner', ['pull'], ['bodyweight'], ['20 sec', '30 sec', '40 sec'], 'Pull hard while keeping the shoulders away from the ears.', bodyweightImage),
  movement('home_band_pulldown', 'Band pulldown', 'calisthenics', 'beginner', ['pull'], ['bands'], ['10 reps', '12–15 reps', '15–20 reps'], 'Start tall and pull the elbows toward the ribs.', bodyweightImage),
  movement('home_inverted_row', 'Inverted row', 'calisthenics', 'steady', ['pull'], ['bodyweight'], ['5–8 reps', '8–12 reps', '10–15 reps'], 'Keep the hips lifted and touch the chest to the support.', bodyweightImage),
  movement('home_pullup', 'Pull-up', 'calisthenics', 'advanced', ['pull', 'skill'], ['bodyweight'], ['3–5 reps', '5–8 reps', '6–12 reps'], 'Drive the elbows down from a controlled hang.', bodyweightImage),
  movement('home_chinup', 'Chin-up', 'calisthenics', 'advanced', ['pull', 'skill'], ['bodyweight'], ['3–5 reps', '5–8 reps', '6–12 reps'], 'Lead with the chest without throwing the head back.', bodyweightImage),
  movement('home_squat', 'Bodyweight squat', 'calisthenics', 'beginner', ['squat', 'legs'], ['bodyweight'], ['10 reps', '15 reps', '20 reps'], 'Sit between the hips and keep the full foot down.', bodyweightImage),
  movement('home_glute_bridge', 'Glute bridge', 'calisthenics', 'beginner', ['hinge', 'legs'], ['bodyweight'], ['10 reps', '15 reps', '20 reps'], 'Finish with the glutes instead of arching the back.', bodyweightImage),
  movement('home_reverse_lunge', 'Reverse lunge', 'calisthenics', 'beginner', ['squat', 'legs'], ['bodyweight'], ['6 each side', '8–12 each side', '12 each side'], 'Step back far enough to keep the front foot grounded.', bodyweightImage),
  movement('home_stepup', 'Step-up', 'calisthenics', 'beginner', ['squat', 'legs'], ['bodyweight'], ['6 each side', '10 each side', '12 each side'], 'Drive through the working foot without pushing off the floor.', bodyweightImage),
  movement('home_split_squat', 'Split squat', 'calisthenics', 'steady', ['squat', 'legs'], ['bodyweight'], ['6 each side', '10 each side', '12 each side'], 'Lower straight down and drive through the front leg.', bodyweightImage),
  movement('home_bulgarian_split', 'Bulgarian split squat', 'calisthenics', 'advanced', ['squat', 'legs'], ['bodyweight'], ['5 each side', '8 each side', '10–15 each side'], 'Keep most of the pressure through the front leg.', bodyweightImage),
  movement('home_pistol_box', 'Pistol squat to box', 'calisthenics', 'advanced', ['squat', 'skill'], ['bodyweight'], ['3 each side', '5 each side', '6–10 each side'], 'Control the descent and use a box height you own.', bodyweightImage),
  movement('home_shrimp_squat', 'Shrimp squat progression', 'calisthenics', 'advanced', ['squat', 'skill'], ['bodyweight'], ['3 each side', '5 each side', '6–8 each side'], 'Use light support and keep the working knee controlled.', bodyweightImage),
  movement('home_good_morning', 'Bodyweight good morning', 'calisthenics', 'beginner', ['hinge', 'mobility'], ['bodyweight'], ['10 reps', '15 reps', '20 reps'], 'Reach the hips back while the spine stays long.', bodyweightImage),
  movement('home_hamstring_walkout', 'Hamstring walkout', 'calisthenics', 'steady', ['hinge'], ['bodyweight'], ['4 reps', '6–8 reps', '8–10 reps'], 'Keep the hips lifted as the heels walk away.', bodyweightImage),
  movement('home_single_leg_bridge', 'Single-leg glute bridge', 'calisthenics', 'steady', ['hinge', 'legs'], ['bodyweight'], ['6 each side', '10 each side', '12–15 each side'], 'Keep the pelvis level as one leg works.', bodyweightImage),
  movement('home_nordic_eccentric', 'Nordic curl eccentric', 'calisthenics', 'advanced', ['hinge', 'skill'], ['bodyweight'], ['3 reps', '4–6 reps', '5–8 reps'], 'Lower slowly and catch with the hands.', bodyweightImage),
  movement('home_dead_bug', 'Dead bug', 'calisthenics', 'beginner', ['core'], ['bodyweight'], ['6 each side', '8 each side', '10 each side'], 'Exhale fully as the opposite arm and leg extend.', bodyweightImage),
  movement('home_bird_dog', 'Bird dog', 'calisthenics', 'beginner', ['core', 'mobility'], ['bodyweight'], ['6 each side', '8 each side', '10 each side'], 'Reach long without rotating the hips.', bodyweightImage),
  movement('home_plank', 'Forearm plank', 'calisthenics', 'beginner', ['core'], ['bodyweight'], ['20 sec', '30–45 sec', '45–60 sec'], 'Pull the elbows toward the toes without moving.', bodyweightImage),
  movement('home_hollow_hold', 'Hollow-body hold', 'calisthenics', 'steady', ['core', 'skill'], ['bodyweight'], ['15 sec', '20–30 sec', '30–45 sec'], 'Choose a leg position that keeps the back connected.', bodyweightImage),
  movement('home_side_plank', 'Side plank', 'calisthenics', 'steady', ['core'], ['bodyweight'], ['15 sec each', '30 sec each', '45 sec each'], 'Push the floor away and keep the hips stacked.', bodyweightImage),
  movement('home_bear_crawl', 'Bear crawl', 'calisthenics', 'steady', ['core', 'conditioning'], ['bodyweight'], ['3 × 10 m', '4 × 10 m', '5 × 10 m'], 'Keep the knees low and move opposite hand and foot.', bodyweightImage),
  movement('home_burpee', 'Burpee', 'calisthenics', 'advanced', ['conditioning'], ['bodyweight'], ['5 reps', '8 reps', '10–15 reps'], 'Keep the pace repeatable instead of sprinting the first set.', bodyweightImage),
  movement('home_mountain_climber', 'Mountain climber', 'calisthenics', 'beginner', ['conditioning', 'core'], ['bodyweight'], ['20 sec', '30 sec', '45 sec'], 'Keep the shoulders over the hands and move quietly.', bodyweightImage),
  movement('home_handstand_hold', 'Wall handstand hold', 'calisthenics', 'advanced', ['skill', 'push'], ['bodyweight'], ['10 sec', '20 sec', '30–45 sec'], 'Push tall through the shoulders and keep the ribs tucked.', bodyweightImage),

  movement('run_walk', 'Run-walk intervals', 'cardio', 'beginner', ['base', 'recovery'], ['bodyweight'], ['1 min run / 2 min walk', '2 min run / 1 min walk', '4 min run / 1 min walk'], 'Finish each run segment able to repeat it.', runImage),
  movement('run_easy', 'Easy conversational run', 'cardio', 'beginner', ['base', 'recovery'], ['bodyweight'], ['easy effort', 'zone 2', 'zone 2'], 'Keep the effort easy enough for short sentences.', runImage),
  movement('run_drills', 'Running drills', 'cardio', 'beginner', ['technique'], ['bodyweight'], ['4 minutes', '6 minutes', '8 minutes'], 'Stay relaxed and make each step quiet.', runImage),
  movement('run_strides', 'Relaxed strides', 'cardio', 'steady', ['speed', 'technique'], ['bodyweight'], ['4 × 15 sec', '6 × 20 sec', '8 × 20 sec'], 'Build speed smoothly rather than sprinting from zero.', runImage),
  movement('run_tempo', 'Tempo blocks', 'cardio', 'steady', ['tempo'], ['bodyweight'], ['2 × 4 min', '3 × 6 min', '3 × 10 min'], 'Hold the fastest pace you could sustain without straining.', runImage),
  movement('run_hills', 'Hill repeats', 'cardio', 'steady', ['hills', 'strength'], ['bodyweight'], ['5 × 30 sec', '6 × 45 sec', '8 × 60 sec'], 'Run tall and recover fully on the walk down.', runImage),
  movement('run_fartlek', 'Fartlek changes', 'cardio', 'steady', ['speed', 'base'], ['bodyweight'], ['6 changes', '8 changes', '10 changes'], 'Let landmarks guide the faster and easier sections.', runImage),
  movement('run_threshold', 'Threshold repeats', 'cardio', 'advanced', ['tempo', 'speed'], ['bodyweight'], ['3 × 4 min', '4 × 6 min', '5 × 6 min'], 'Keep the final repeat as controlled as the first.', runImage),
  movement('run_hill_sprint', 'Hill sprints', 'cardio', 'advanced', ['hills', 'speed'], ['bodyweight'], ['4 × 8 sec', '6 × 10 sec', '8 × 12 sec'], 'Use full walking recovery and stop before speed drops.', runImage),
  movement('run_mobility', 'Ankle + hip mobility', 'cardio', 'beginner', ['mobility', 'recovery'], ['bodyweight'], ['4 minutes', '6 minutes', '8 minutes'], 'Move slowly through comfortable ranges.', runImage),

  movement('bike_easy', 'Easy spin', 'cycling', 'beginner', ['base', 'recovery'], ['bike'], ['easy gear', 'zone 2', 'zone 2'], 'Keep the pedals quiet and the effort conversational.', bikeImage),
  movement('bike_cadence', 'Cadence practice', 'cycling', 'beginner', ['cadence', 'technique'], ['bike'], ['4 × 30 sec', '6 × 45 sec', '8 × 60 sec'], 'Spin smoothly without bouncing in the saddle.', bikeImage),
  movement('bike_endurance', 'Endurance block', 'cycling', 'beginner', ['base'], ['bike'], ['steady effort', '20 min steady', '30 min steady'], 'Settle into a pace you could extend.', bikeImage),
  movement('bike_hills', 'Seated hill repeats', 'cycling', 'steady', ['hills', 'strength'], ['bike'], ['4 climbs', '6 climbs', '8 climbs'], 'Stay seated first and keep the cadence controlled.', bikeImage),
  movement('bike_tempo', 'Tempo blocks', 'cycling', 'steady', ['tempo', 'base'], ['bike'], ['2 × 5 min', '3 × 8 min', '3 × 12 min'], 'Ride firmly without turning the block into a sprint.', bikeImage),
  movement('bike_cadence_ladder', 'Cadence ladder', 'cycling', 'steady', ['cadence', 'speed'], ['bike'], ['4 steps', '6 steps', '8 steps'], 'Increase cadence while keeping the upper body calm.', bikeImage),
  movement('bike_over_under', 'Over-under intervals', 'cycling', 'advanced', ['tempo', 'speed'], ['bike'], ['3 × 5 min', '4 × 6 min', '4 × 8 min'], 'Move just above and below threshold without surging.', bikeImage),
  movement('bike_sprints', 'Sprint cadence set', 'cycling', 'advanced', ['speed'], ['bike'], ['4 × 10 sec', '6 × 12 sec', '8 × 15 sec'], 'Use full recovery so every sprint stays crisp.', bikeImage),
  movement('bike_mobility', 'Hip + back reset', 'cycling', 'beginner', ['mobility', 'recovery'], ['bodyweight'], ['4 minutes', '6 minutes', '8 minutes'], 'Breathe slowly and release the riding position.', bikeImage),
];

export function buildWorkoutPlan(input: WorkoutPlanInput): WorkoutSession[] {
  const seed = input.seed ?? new Date().toISOString().slice(0, 10);
  const sessionCount = input.level === 'advanced' ? 5 : input.level === 'steady' ? 4 : 3;
  const exerciseCount = input.durationMinutes <= 25 ? 4 : input.durationMinutes >= 55 ? 6 : 5;
  const templates = focusTemplates[input.category];
  const used = new Set<string>();
  const progression = progressionFor(seed, input.category, input.level);

  return Array.from({ length: sessionCount }, (_, index) => {
    const template = templates[index % templates.length];
    const pool = movements.filter((item) => item.category === input.category && levelRank(item.minLevel) <= levelRank(input.level));
    const unusedPool = pool.filter((item) => !used.has(item.id));
    const candidatePool = unusedPool.length >= exerciseCount ? unusedPool : pool;
    const ordered = [...candidatePool].sort((left, right) => {
      const leftScore = movementScore(left, template.focus, input.level, used, `${seed}:${index}`);
      const rightScore = movementScore(right, template.focus, input.level, used, `${seed}:${index}`);
      return rightScore - leftScore;
    });
    const selected = ordered.slice(0, exerciseCount);
    selected.forEach((item) => used.add(item.id));

    return {
      id: `${seed}_${input.category}_${index + 1}`,
      title: template.title,
      focus: template.focus.map(titleCase).join(' + '),
      durationMinutes: input.durationMinutes,
      warmup: warmupFor(input.category, input.durationMinutes),
      exercises: selected.map((item, exerciseIndex) => plannedExercise(item, input, progression.setAdjustment, pool, exerciseIndex)),
      cooldown: cooldownFor(input.category),
      progression: progression.guidance,
    };
  });
}

function plannedExercise(item: Movement, input: WorkoutPlanInput, setAdjustment: number, pool: Movement[], index: number): PlannedExercise {
  const baseSets = input.durationMinutes <= 25 ? 2 : input.durationMinutes >= 55 ? 4 : 3;
  const levelSets = input.level === 'advanced' && index < 2 ? 1 : 0;
  const sets = Math.max(2, baseSets + levelSets + setAdjustment);
  const alternatives = pool
    .filter((candidate) => candidate.id !== item.id && candidate.focus.some((focus) => item.focus.includes(focus)))
    .sort((left, right) => levelRank(right.minLevel) - levelRank(left.minLevel))
    .slice(0, 2)
    .map((candidate) => candidate.name);
  const timedCategory = input.category === 'cardio' || input.category === 'cycling';
  return {
    id: item.id,
    name: item.name,
    prescription: timedCategory ? item.reps[input.level] : `${sets} sets × ${item.reps[input.level]}`,
    cue: item.cue,
    equipment: item.equipment,
    imageUrl: item.imageUrl,
    alternatives,
  };
}

function movementScore(item: Movement, focus: string[], level: WorkoutLevel, used: Set<string>, seed: string) {
  const focusMatches = item.focus.filter((tag) => focus.includes(tag)).length;
  const exactLevel = item.minLevel === level ? 20 : 0;
  const variety = used.has(item.id) ? -25 : 25;
  return focusMatches * 100 + exactLevel + variety + stableIndex(`${seed}:${item.id}`, 13);
}

function progressionFor(seed: string, category: WorkoutCategory, level: WorkoutLevel) {
  const date = new Date(`${seed}T12:00:00`);
  const weekIndex = Math.floor(date.getTime() / 604_800_000) % 4;
  if (weekIndex === 3) return { setAdjustment: -1, guidance: 'Recovery week: leave three good reps in reserve and keep every set crisp.' };
  if (category === 'cardio' || category === 'cycling') {
    return weekIndex === 0
      ? { setAdjustment: 0, guidance: 'Base week: finish with enough energy to repeat the session.' }
      : weekIndex === 1
        ? { setAdjustment: 0, guidance: 'Build week: add one interval or two easy minutes if recovery is good.' }
        : { setAdjustment: 0, guidance: 'Progress week: hold the same duration with slightly stronger pace or cadence.' };
  }
  if (weekIndex === 0) return { setAdjustment: 0, guidance: 'Base week: choose loads or variations that leave two good reps in reserve.' };
  if (weekIndex === 1) return { setAdjustment: 0, guidance: `Build week: add 1–2 reps per set before changing ${level === 'advanced' ? 'load or leverage' : 'the exercise'}.` };
  return { setAdjustment: 1, guidance: category === 'gym' ? 'Progress week: add a small load only after every prescribed rep is clean.' : 'Progress week: use a harder variation only after the top of the rep range feels controlled.' };
}

function warmupFor(category: WorkoutCategory, durationMinutes: number) {
  const minutes = durationMinutes <= 25 ? 4 : durationMinutes >= 55 ? 8 : 6;
  if (category === 'cardio') return `${minutes} min brisk walk or easy jog, then relaxed running drills.`;
  if (category === 'cycling') return `${minutes} min easy spin, gradually bringing cadence up.`;
  return `${minutes} min joint prep, easy movement patterns, and two gradual practice sets.`;
}

function cooldownFor(category: WorkoutCategory) {
  if (category === 'cardio') return 'Walk until breathing settles, then loosen calves and hips.';
  if (category === 'cycling') return 'Spin easily for 3–5 minutes, then reset hips and upper back.';
  return 'Two easy minutes, then breathe and move through the areas trained today.';
}

function movement(
  id: string,
  name: string,
  category: WorkoutCategory,
  minLevel: WorkoutLevel,
  focus: string[],
  equipment: string[],
  reps: [string, string, string],
  cue: string,
  imageUrl: string,
): Movement {
  return { id, name, category, minLevel, focus, equipment, reps: { beginner: reps[0], steady: reps[1], advanced: reps[2] }, cue, imageUrl };
}

function levelRank(level: WorkoutLevel) {
  return level === 'beginner' ? 0 : level === 'steady' ? 1 : 2;
}

function stableIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  return modulo === 0 ? 0 : hash % modulo;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
