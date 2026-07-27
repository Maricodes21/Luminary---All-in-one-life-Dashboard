export type WorkoutCategory = 'calisthenics' | 'cardio' | 'cycling' | 'gym' | 'yoga';
export type WorkoutLevel = 'beginner' | 'steady' | 'advanced';
export type WorkoutFocus = 'strength' | 'mobility' | 'energy' | 'momentum';

export type PlannedExercise = {
  id: string;
  name: string;
  prescription: string;
  cue: string;
  equipment: string[];
  visualId: string;
  alternatives: PlannedExerciseAlternative[];
};

export type PlannedExerciseAlternative = Omit<PlannedExercise, 'alternatives'>;

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
  daysPerWeek?: number;
  weeklyFocus?: WorkoutFocus;
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
  visualId: string;
};

const visual = (id: string) => id;
const strengthImage = visual('gym');
const bodyweightImage = visual('home');
const runImage = visual('run');
const bikeImage = visual('bike');

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
  yoga: [
    { title: 'Morning mobility', focus: ['mobility', 'breath', 'spine'] },
    { title: 'Hips + hamstrings', focus: ['hips', 'hamstrings', 'recovery'] },
    { title: 'Spine + shoulders', focus: ['spine', 'shoulders', 'mobility'] },
    { title: 'Full-body reset', focus: ['mobility', 'balance', 'breath'] },
    { title: 'Evening unwind', focus: ['recovery', 'breath', 'hips'] },
    { title: 'Balance + control', focus: ['balance', 'core', 'mobility'] },
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
  movement('gym_good_morning', 'Barbell good morning', 'gym', 'steady', ['hinge'], ['barbell'], ['8 reps', '8–10 reps', '6–8 reps'], 'Keep the bar settled and send the hips back before the knees bend.', strengthImage),
  movement('gym_cable_pull_through', 'Cable pull-through', 'gym', 'beginner', ['hinge'], ['machine'], ['10 reps', '10–15 reps', '8–12 reps'], 'Let the cable travel between the legs, then stand tall with the glutes.', strengthImage),
  movement('gym_hack_squat', 'Hack squat', 'gym', 'steady', ['squat', 'legs'], ['machine'], ['8 reps', '8–12 reps', '6–10 reps'], 'Keep the back supported and drive through the whole foot.', strengthImage),
  movement('gym_step_up', 'Dumbbell step-up', 'gym', 'beginner', ['squat', 'legs'], ['dumbbells'], ['6 each side', '8–10 each side', '8–12 each side'], 'Finish each rep balanced on the box before stepping down.', strengthImage),
  movement('gym_close_grip_bench', 'Close-grip bench press', 'gym', 'steady', ['push'], ['barbell'], ['6 reps', '6–10 reps', '5–8 reps'], 'Keep the wrists stacked and the elbows comfortably close.', strengthImage),
  movement('gym_landmine_press', 'Half-kneeling landmine press', 'gym', 'beginner', ['push', 'core'], ['barbell'], ['8 each side', '10 each side', '8–12 each side'], 'Stay tall through the kneeling hip as the bar travels forward.', strengthImage),
  movement('gym_assisted_pullup', 'Assisted pull-up', 'gym', 'beginner', ['pull'], ['machine'], ['6 reps', '8–12 reps', '8–12 reps'], 'Use only enough assistance to keep the pull smooth.', strengthImage),
  movement('gym_reverse_fly', 'Cable reverse fly', 'gym', 'beginner', ['pull'], ['machine'], ['10 reps', '12–15 reps', '12–20 reps'], 'Open the arms without lifting the shoulders.', strengthImage),

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
  movement('home_chair_squat', 'Chair squat', 'calisthenics', 'beginner', ['squat', 'legs'], ['bodyweight'], ['8 reps', '12 reps', '15 reps'], 'Touch the chair softly, then stand through the whole foot.', bodyweightImage),
  movement('home_wall_sit', 'Wall sit', 'calisthenics', 'beginner', ['squat', 'legs'], ['bodyweight'], ['20 sec', '30–45 sec', '45–60 sec'], 'Keep the back settled and breathe without bracing the neck.', bodyweightImage),
  movement('home_calf_raise', 'Single-leg calf raise', 'calisthenics', 'steady', ['legs'], ['bodyweight'], ['8 each side', '12 each side', '15–20 each side'], 'Pause at the top and lower the heel slowly.', bodyweightImage),
  movement('home_scapular_pushup', 'Scapular push-up', 'calisthenics', 'beginner', ['push', 'mobility'], ['bodyweight'], ['8 reps', '12 reps', '15 reps'], 'Keep the elbows straight while the shoulder blades glide.', bodyweightImage),
  movement('home_band_pull_apart', 'Band pull-apart', 'calisthenics', 'beginner', ['pull', 'mobility'], ['bands'], ['10 reps', '15 reps', '20 reps'], 'Open the band at chest height without arching the back.', bodyweightImage),
  movement('home_superman_hold', 'Superman hold', 'calisthenics', 'beginner', ['hinge', 'core'], ['bodyweight'], ['15 sec', '20–30 sec', '30–40 sec'], 'Reach long rather than lifting as high as possible.', bodyweightImage),
  movement('home_skater_hop', 'Skater hop', 'calisthenics', 'steady', ['conditioning', 'legs'], ['bodyweight'], ['6 each side', '10 each side', '12–16 each side'], 'Land quietly and own the balance before crossing back.', bodyweightImage),

  yogaMovement('yoga_cat_cow', 'Cat-cow flow', 'beginner', ['spine', 'mobility', 'breath'], ['6 slow rounds', '8 slow rounds', '10 slow rounds'], 'Move one vertebra at a time and let the breath set the pace.', 'home_bird_dog'),
  yogaMovement('yoga_child_pose', "Child's pose", 'beginner', ['hips', 'recovery', 'breath'], ['45 sec', '60 sec', '90 sec'], 'Let the forehead rest and breathe into the back of the ribs.', 'home_bird_dog'),
  yogaMovement('yoga_downward_dog', 'Downward-facing dog', 'beginner', ['hamstrings', 'shoulders', 'mobility'], ['30 sec', '45 sec', '60 sec'], 'Keep the knees soft enough to lengthen the spine.', 'home_pike_pushup'),
  yogaMovement('yoga_cobra', 'Low cobra', 'beginner', ['spine', 'shoulders'], ['5 breaths', '6 breaths', '8 breaths'], 'Lift from the upper back and keep little weight in the hands.', 'home_superman_hold'),
  yogaMovement('yoga_sphinx', 'Sphinx pose', 'beginner', ['spine', 'recovery'], ['45 sec', '60 sec', '90 sec'], 'Press the forearms down and keep the lower back comfortable.', 'home_superman_hold'),
  yogaMovement('yoga_low_lunge', 'Low lunge', 'beginner', ['hips', 'mobility'], ['30 sec each', '45 sec each', '60 sec each'], 'Tuck the pelvis slightly before easing the hips forward.', 'home_reverse_lunge'),
  yogaMovement('yoga_half_split', 'Half split', 'beginner', ['hamstrings', 'recovery'], ['30 sec each', '45 sec each', '60 sec each'], 'Keep a long spine and stop before the stretch turns sharp.', 'home_hamstring_walkout'),
  yogaMovement('yoga_forward_fold', 'Standing forward fold', 'beginner', ['hamstrings', 'spine', 'recovery'], ['5 breaths', '8 breaths', '10 breaths'], 'Bend the knees and let the head and arms feel heavy.', 'home_good_morning'),
  yogaMovement('yoga_butterfly', 'Butterfly fold', 'beginner', ['hips', 'recovery'], ['45 sec', '60 sec', '90 sec'], 'Support the knees if needed and fold from the hips.', 'home_squat'),
  yogaMovement('yoga_figure_four', 'Reclined figure four', 'beginner', ['hips', 'recovery'], ['30 sec each', '45 sec each', '60 sec each'], 'Keep the tailbone heavy and the foot gently flexed.', 'home_glute_bridge'),
  yogaMovement('yoga_supine_twist', 'Supine twist', 'beginner', ['spine', 'recovery', 'breath'], ['5 breaths each', '8 breaths each', '10 breaths each'], 'Let the shoulders stay grounded as the knees move across.', 'home_dead_bug'),
  yogaMovement('yoga_knees_chest', 'Knees-to-chest hold', 'beginner', ['hips', 'recovery'], ['30 sec', '45 sec', '60 sec'], 'Relax the shoulders and let the lower back widen.', 'home_dead_bug'),
  yogaMovement('yoga_bridge', 'Bridge pose', 'beginner', ['hips', 'spine', 'core'], ['5 breaths', '8 breaths', '10 breaths'], 'Press through the feet and keep the ribs from flaring.', 'home_glute_bridge'),
  yogaMovement('yoga_thread_needle', 'Thread the needle', 'beginner', ['shoulders', 'spine', 'recovery'], ['30 sec each', '45 sec each', '60 sec each'], 'Rotate through the upper back while the hips stay over the knees.', 'home_bird_dog'),
  yogaMovement('yoga_puppy_pose', 'Puppy pose', 'beginner', ['shoulders', 'spine', 'mobility'], ['30 sec', '45 sec', '60 sec'], 'Keep the hips above the knees and reach the chest forward.', 'home_pike_pushup'),
  yogaMovement('yoga_mountain', 'Mountain pose breathing', 'beginner', ['balance', 'breath'], ['6 breaths', '8 breaths', '10 breaths'], 'Stand evenly through both feet and soften the jaw.', 'home_calf_raise'),
  yogaMovement('yoga_chair', 'Chair pose', 'steady', ['hips', 'core', 'balance'], ['20 sec', '30 sec', '45 sec'], 'Sit the hips back while keeping weight through the heels.', 'home_chair_squat'),
  yogaMovement('yoga_warrior_one', 'Warrior I', 'steady', ['hips', 'shoulders', 'balance'], ['30 sec each', '45 sec each', '60 sec each'], 'Square the hips as much as feels natural and keep the front knee steady.', 'home_split_squat'),
  yogaMovement('yoga_warrior_two', 'Warrior II', 'steady', ['hips', 'balance', 'shoulders'], ['30 sec each', '45 sec each', '60 sec each'], 'Reach through both hands and track the front knee over the toes.', 'home_reverse_lunge'),
  yogaMovement('yoga_triangle', 'Triangle pose', 'steady', ['hamstrings', 'spine', 'balance'], ['30 sec each', '45 sec each', '60 sec each'], 'Lengthen both sides of the waist before rotating the chest.', 'home_side_plank'),
  yogaMovement('yoga_tree', 'Tree pose', 'steady', ['balance', 'hips'], ['20 sec each', '30 sec each', '45 sec each'], 'Place the foot below or above the knee and keep the gaze steady.', 'home_calf_raise'),
  yogaMovement('yoga_eagle', 'Eagle pose', 'steady', ['balance', 'hips', 'shoulders'], ['20 sec each', '30 sec each', '45 sec each'], 'Sit back gently and use a kickstand foot if balance wobbles.', 'home_squat'),
  yogaMovement('yoga_plank_dog', 'Plank to downward dog', 'steady', ['core', 'shoulders', 'mobility'], ['6 rounds', '8 rounds', '10 rounds'], 'Move from a steady trunk and pause in each shape.', 'home_plank'),
  yogaMovement('yoga_side_angle', 'Extended side angle', 'steady', ['hips', 'spine', 'balance'], ['30 sec each', '45 sec each', '60 sec each'], 'Rest the forearm lightly and reach through the top fingertips.', 'home_side_plank'),
  yogaMovement('yoga_pigeon', 'Supported pigeon', 'steady', ['hips', 'recovery'], ['45 sec each', '60 sec each', '90 sec each'], 'Add support under the front hip so the pelvis can settle evenly.', 'home_split_squat'),
  yogaMovement('yoga_lizard', 'Lizard lunge', 'steady', ['hips', 'hamstrings', 'mobility'], ['30 sec each', '45 sec each', '60 sec each'], 'Keep the front foot grounded and choose hands or forearms.', 'home_reverse_lunge'),
  yogaMovement('yoga_happy_baby', 'Happy baby', 'beginner', ['hips', 'recovery', 'breath'], ['45 sec', '60 sec', '90 sec'], 'Hold behind the thighs if the feet are hard to reach.', 'home_dead_bug'),
  yogaMovement('yoga_boat', 'Boat pose', 'advanced', ['core', 'balance'], ['20 sec', '30 sec', '45 sec'], 'Lift the chest and bend the knees whenever the lower back rounds.', 'home_hollow_hold'),
  yogaMovement('yoga_crow_prep', 'Crow pose preparation', 'advanced', ['balance', 'core', 'shoulders'], ['3 attempts', '5 attempts', '8 attempts'], 'Shift forward slowly and keep one or both toes available to the floor.', 'home_bear_crawl'),
  yogaMovement('yoga_half_moon', 'Half moon pose', 'advanced', ['balance', 'hips', 'core'], ['20 sec each', '30 sec each', '45 sec each'], 'Use a block or wall and stack the hips before lifting the gaze.', 'home_single_leg_bridge'),

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
  movement('run_recovery_walk', 'Recovery walk', 'cardio', 'beginner', ['recovery', 'base'], ['bodyweight'], ['15 min easy', '20 min easy', '25 min easy'], 'Let the arms swing and keep the breath completely unforced.', runImage),
  movement('run_long_easy', 'Long easy run', 'cardio', 'steady', ['base'], ['bodyweight'], ['25 min easy', '40 min easy', '60 min easy'], 'Stay slower than you think you need to for the first third.', runImage),
  movement('run_progression', 'Progression run', 'cardio', 'steady', ['base', 'tempo'], ['bodyweight'], ['15 min build', '25 min build', '40 min build'], 'Let the pace rise gradually while the form stays relaxed.', runImage),
  movement('run_negative_split', 'Negative-split run', 'cardio', 'steady', ['base', 'tempo'], ['bodyweight'], ['2 × 8 min', '2 × 12 min', '2 × 20 min'], 'Make the second half controlled and slightly quicker than the first.', runImage),
  movement('run_cruise_intervals', 'Cruise intervals', 'cardio', 'steady', ['tempo'], ['bodyweight'], ['3 × 3 min', '4 × 5 min', '5 × 6 min'], 'Float through the short recovery instead of stopping.', runImage),
  movement('run_400_repeats', '400 m repeats', 'cardio', 'advanced', ['speed'], ['bodyweight'], ['4 repeats', '6 repeats', '8 repeats'], 'Run evenly enough that the final repeat matches the first.', runImage),
  movement('run_800_repeats', '800 m repeats', 'cardio', 'advanced', ['speed', 'tempo'], ['bodyweight'], ['3 repeats', '5 repeats', '6 repeats'], 'Settle early and keep the shoulders quiet.', runImage),
  movement('run_1k_repeats', '1 km repeats', 'cardio', 'advanced', ['tempo', 'speed'], ['bodyweight'], ['3 repeats', '4 repeats', '5 repeats'], 'Aim for repeatable rhythm rather than a fast opening split.', runImage),
  movement('run_track_ladder', 'Track ladder', 'cardio', 'advanced', ['speed'], ['bodyweight'], ['200–400–200 m', '200–400–600–400–200 m', '400–800–1200–800–400 m'], 'Change distance, not running form.', runImage),
  movement('run_trail', 'Easy trail run', 'cardio', 'beginner', ['base', 'technique'], ['bodyweight'], ['20 min easy', '30 min easy', '45 min easy'], 'Shorten the stride when the ground becomes uneven.', runImage),
  movement('run_steady_state', 'Steady-state run', 'cardio', 'steady', ['base', 'tempo'], ['bodyweight'], ['15 min steady', '25 min steady', '35 min steady'], 'Hold one quiet pace that never turns into a race.', runImage),
  movement('run_aerobic_intervals', 'Aerobic intervals', 'cardio', 'beginner', ['base', 'recovery'], ['bodyweight'], ['4 × 2 min', '6 × 3 min', '8 × 3 min'], 'Use easy jogging recoveries and finish with room left.', runImage),
  movement('run_downhill_technique', 'Downhill technique', 'cardio', 'steady', ['hills', 'technique'], ['bodyweight'], ['4 passes', '6 passes', '8 passes'], 'Keep the steps quick and land beneath the hips.', runImage),
  movement('run_cadence_strides', 'Cadence strides', 'cardio', 'steady', ['speed', 'technique'], ['bodyweight'], ['4 × 20 sec', '6 × 20 sec', '8 × 30 sec'], 'Think quick feet, not a longer reach.', runImage),
  movement('run_shakeout', 'Easy shakeout jog', 'cardio', 'beginner', ['recovery'], ['bodyweight'], ['10 min easy', '15 min easy', '20 min easy'], 'Keep this genuinely gentle and stop if the legs feel worse.', runImage),
  movement('run_commute', 'Run commute', 'cardio', 'steady', ['base'], ['bodyweight'], ['20 min route', '30 min route', '45 min route'], 'Choose a familiar route and leave the pace open.', runImage),
  movement('run_5k_rehearsal', '5 km pace rehearsal', 'cardio', 'advanced', ['tempo', 'speed'], ['bodyweight'], ['3 × 3 min', '4 × 5 min', '3 × 8 min'], 'Practice goal rhythm without completing the full race effort.', runImage),
  movement('run_fartlek_pyramid', 'Fartlek pyramid', 'cardio', 'steady', ['speed', 'base'], ['bodyweight'], ['1–2–1 min', '1–2–3–2–1 min', '1–2–3–4–3–2–1 min'], 'Keep the changes playful and the easy sections truly easy.', runImage),
  movement('run_uphill_tempo', 'Uphill tempo', 'cardio', 'advanced', ['hills', 'tempo'], ['bodyweight'], ['2 × 4 min', '3 × 6 min', '3 × 8 min'], 'Use effort rather than flat-ground pace to guide the climb.', runImage),
  movement('run_technique_reset', 'Running form reset', 'cardio', 'beginner', ['technique', 'mobility'], ['bodyweight'], ['6 minutes', '8 minutes', '10 minutes'], 'Use marching, skips, and short relaxed accelerations.', runImage),

  movement('bike_easy', 'Easy spin', 'cycling', 'beginner', ['base', 'recovery'], ['bike'], ['easy gear', 'zone 2', 'zone 2'], 'Keep the pedals quiet and the effort conversational.', bikeImage),
  movement('bike_cadence', 'Cadence practice', 'cycling', 'beginner', ['cadence', 'technique'], ['bike'], ['4 × 30 sec', '6 × 45 sec', '8 × 60 sec'], 'Spin smoothly without bouncing in the saddle.', bikeImage),
  movement('bike_endurance', 'Endurance block', 'cycling', 'beginner', ['base'], ['bike'], ['steady effort', '20 min steady', '30 min steady'], 'Settle into a pace you could extend.', bikeImage),
  movement('bike_hills', 'Seated hill repeats', 'cycling', 'steady', ['hills', 'strength'], ['bike'], ['4 climbs', '6 climbs', '8 climbs'], 'Stay seated first and keep the cadence controlled.', bikeImage),
  movement('bike_tempo', 'Tempo blocks', 'cycling', 'steady', ['tempo', 'base'], ['bike'], ['2 × 5 min', '3 × 8 min', '3 × 12 min'], 'Ride firmly without turning the block into a sprint.', bikeImage),
  movement('bike_cadence_ladder', 'Cadence ladder', 'cycling', 'steady', ['cadence', 'speed'], ['bike'], ['4 steps', '6 steps', '8 steps'], 'Increase cadence while keeping the upper body calm.', bikeImage),
  movement('bike_over_under', 'Over-under intervals', 'cycling', 'advanced', ['tempo', 'speed'], ['bike'], ['3 × 5 min', '4 × 6 min', '4 × 8 min'], 'Move just above and below threshold without surging.', bikeImage),
  movement('bike_sprints', 'Sprint cadence set', 'cycling', 'advanced', ['speed'], ['bike'], ['4 × 10 sec', '6 × 12 sec', '8 × 15 sec'], 'Use full recovery so every sprint stays crisp.', bikeImage),
  movement('bike_mobility', 'Hip + back reset', 'cycling', 'beginner', ['mobility', 'recovery'], ['bodyweight'], ['4 minutes', '6 minutes', '8 minutes'], 'Breathe slowly and release the riding position.', bikeImage),
  movement('bike_recovery_ride', 'Recovery ride', 'cycling', 'beginner', ['recovery', 'base'], ['bike'], ['15 min easy', '25 min easy', '35 min easy'], 'Choose a light gear and let the legs turn without pressure.', bikeImage),
  movement('bike_long_endurance', 'Long endurance ride', 'cycling', 'steady', ['base'], ['bike'], ['35 min steady', '60 min steady', '90 min steady'], 'Fuel early and keep the effort below the point of strain.', bikeImage),
  movement('bike_sweet_spot', 'Sweet-spot blocks', 'cycling', 'steady', ['tempo', 'strength'], ['bike'], ['2 × 6 min', '3 × 10 min', '3 × 15 min'], 'Ride firmly while keeping breathing and cadence controlled.', bikeImage),
  movement('bike_standing_climbs', 'Standing climb repeats', 'cycling', 'steady', ['hills', 'strength'], ['bike'], ['4 climbs', '6 climbs', '8 climbs'], 'Stand smoothly with quiet hips and steady pressure.', bikeImage),
  movement('bike_low_cadence', 'Low-cadence strength', 'cycling', 'steady', ['strength', 'hills'], ['bike'], ['4 × 2 min', '5 × 3 min', '6 × 4 min'], 'Use a heavy but smooth gear without grinding the knees.', bikeImage),
  movement('bike_spinups', 'High-cadence spin-ups', 'cycling', 'beginner', ['cadence', 'technique'], ['bike'], ['4 × 20 sec', '6 × 30 sec', '8 × 40 sec'], 'Increase leg speed while the upper body stays still.', bikeImage),
  movement('bike_vo2', 'VO2 intervals', 'cycling', 'advanced', ['speed'], ['bike'], ['4 × 2 min', '5 × 3 min', '6 × 4 min'], 'Start controlled enough to finish every interval at the same power.', bikeImage),
  movement('bike_threshold', 'Threshold blocks', 'cycling', 'advanced', ['tempo', 'speed'], ['bike'], ['2 × 8 min', '3 × 10 min', '2 × 20 min'], 'Settle into a hard, sustainable effort without surging.', bikeImage),
  movement('bike_descending', 'Descending skills', 'cycling', 'steady', ['technique', 'recovery'], ['bike'], ['4 descents', '6 descents', '8 descents'], 'Look through the turn and keep weight balanced over both wheels.', bikeImage),
  movement('bike_cornering', 'Cornering practice', 'cycling', 'beginner', ['technique'], ['bike'], ['6 turns', '10 turns', '14 turns'], 'Brake before the turn and look toward the exit.', bikeImage),
  movement('bike_single_leg', 'Single-leg pedal drills', 'cycling', 'steady', ['cadence', 'technique'], ['bike'], ['4 × 20 sec', '6 × 30 sec', '8 × 40 sec'], 'Keep pressure smooth through the full circle.', bikeImage),
  movement('bike_rolling_terrain', 'Rolling-terrain ride', 'cycling', 'beginner', ['base', 'hills'], ['bike'], ['20 min', '35 min', '50 min'], 'Shift early and let the effort stay even over each rise.', bikeImage),
  movement('bike_negative_split', 'Negative-split ride', 'cycling', 'steady', ['base', 'tempo'], ['bike'], ['2 × 10 min', '2 × 20 min', '2 × 30 min'], 'Make the second half slightly stronger without sprinting.', bikeImage),
  movement('bike_aerobic_intervals', 'Aerobic ride intervals', 'cycling', 'beginner', ['base', 'recovery'], ['bike'], ['4 × 3 min', '6 × 4 min', '8 × 5 min'], 'Recover in an easy gear and keep every work block conversational.', bikeImage),
  movement('bike_group_sim', 'Group-ride simulation', 'cycling', 'advanced', ['speed', 'base'], ['bike'], ['6 changes', '10 changes', '14 changes'], 'Respond to pace changes, then settle instead of continuing to surge.', bikeImage),
  movement('bike_indoor_pyramid', 'Indoor interval pyramid', 'cycling', 'steady', ['tempo', 'cadence'], ['bike'], ['1–2–1 min', '2–4–6–4–2 min', '3–6–9–6–3 min'], 'Build duration while keeping cadence inside a narrow range.', bikeImage),
  movement('bike_sprint_leadins', 'Sprint lead-ins', 'cycling', 'advanced', ['speed', 'technique'], ['bike'], ['4 efforts', '6 efforts', '8 efforts'], 'Build for ten seconds before opening the sprint.', bikeImage),
  movement('bike_tempo_finish', 'Tempo-finish ride', 'cycling', 'steady', ['base', 'tempo'], ['bike'], ['10 min finish', '15 min finish', '20 min finish'], 'Keep the opening easy so the closing block stays composed.', bikeImage),
  movement('bike_commute', 'Easy commute ride', 'cycling', 'beginner', ['base', 'recovery'], ['bike'], ['15 min route', '25 min route', '40 min route'], 'Choose an easy route and leave extra time for a calm pace.', bikeImage),
  movement('bike_gravel', 'Gravel endurance ride', 'cycling', 'steady', ['base', 'technique'], ['bike'], ['30 min', '50 min', '75 min'], 'Stay loose through the arms and let the bike move beneath you.', bikeImage),
  movement('bike_mobility_flow', 'Cyclist mobility flow', 'cycling', 'beginner', ['mobility', 'recovery'], ['bodyweight'], ['6 minutes', '10 minutes', '12 minutes'], 'Open the hips, upper back, and ankles with unhurried breathing.', bikeImage),
  movement('run_stadium_stairs', 'Stadium stair repeats', 'cardio', 'steady', ['hills', 'strength'], ['bodyweight'], ['4 climbs', '6 climbs', '8 climbs'], 'Keep the steps compact and walk down for recovery.', runImage),
  movement('run_beach', 'Easy beach run', 'cardio', 'steady', ['base', 'technique'], ['bodyweight'], ['15 min easy', '25 min easy', '35 min easy'], 'Choose firm sand and shorten the stride.', runImage),
  movement('run_treadmill_incline', 'Treadmill incline blocks', 'cardio', 'beginner', ['hills', 'base'], ['bodyweight'], ['4 × 2 min', '6 × 3 min', '8 × 4 min'], 'Raise the incline before the speed and keep the posture tall.', runImage),
  movement('run_treadmill_easy', 'Easy treadmill run', 'cardio', 'beginner', ['base', 'recovery'], ['bodyweight'], ['15 min easy', '25 min easy', '40 min easy'], 'Use a pace that lets the shoulders and hands stay loose.', runImage),
  movement('run_relay_intervals', 'Relay-style intervals', 'cardio', 'advanced', ['speed', 'recovery'], ['bodyweight'], ['6 efforts', '8 efforts', '12 efforts'], 'Run each effort as if handing off to an equally strong next rep.', runImage),
  movement('run_metronome', 'Cadence metronome run', 'cardio', 'steady', ['technique', 'speed'], ['bodyweight'], ['4 × 2 min', '6 × 3 min', '8 × 3 min'], 'Match the rhythm with shorter steps instead of forcing pace.', runImage),
  movement('run_cross_country', 'Cross-country loop', 'cardio', 'steady', ['base', 'hills', 'technique'], ['bodyweight'], ['20 min', '35 min', '50 min'], 'Let effort rise on the hills and settle on open ground.', runImage),
  movement('run_marathon_pace', 'Marathon-pace block', 'cardio', 'advanced', ['tempo', 'base'], ['bodyweight'], ['10 min', '20 min', '35 min'], 'Hold a patient rhythm that feels sustainable beyond the block.', runImage),
  movement('bike_criterium', 'Criterium corner repeats', 'cycling', 'advanced', ['technique', 'speed'], ['bike'], ['6 laps', '10 laps', '14 laps'], 'Brake early, look through the corner, then accelerate smoothly.', bikeImage),
  movement('bike_gravel_climbs', 'Gravel climb repeats', 'cycling', 'steady', ['hills', 'strength', 'technique'], ['bike'], ['4 climbs', '6 climbs', '8 climbs'], 'Stay seated where traction is limited and keep pressure even.', bikeImage),
  movement('bike_aero_position', 'Aero-position practice', 'cycling', 'steady', ['technique', 'tempo'], ['bike'], ['4 × 3 min', '6 × 4 min', '8 × 5 min'], 'Settle the shoulders and keep vision forward without craning the neck.', bikeImage),
  movement('bike_seated_accel', 'Seated accelerations', 'cycling', 'steady', ['speed', 'cadence'], ['bike'], ['4 efforts', '6 efforts', '8 efforts'], 'Build cadence smoothly while the hips stay planted.', bikeImage),
  movement('bike_standing_accel', 'Standing accelerations', 'cycling', 'advanced', ['speed', 'strength'], ['bike'], ['4 efforts', '6 efforts', '8 efforts'], 'Rise smoothly and keep the bicycle controlled beneath you.', bikeImage),
  movement('bike_endurance_cadence', 'Endurance cadence hold', 'cycling', 'beginner', ['base', 'cadence'], ['bike'], ['10 min', '20 min', '30 min'], 'Choose one comfortable cadence and let the effort stay quiet.', bikeImage),
  movement('bike_recovery_cadence', 'Recovery cadence reset', 'cycling', 'beginner', ['recovery', 'cadence'], ['bike'], ['6 minutes', '10 minutes', '15 minutes'], 'Use a light gear and let leg speed return without pressure.', bikeImage),
  movement('bike_mixed_terrain', 'Mixed-terrain skills ride', 'cycling', 'steady', ['base', 'technique', 'hills'], ['bike'], ['20 min', '35 min', '50 min'], 'Adjust position early as the surface and gradient change.', bikeImage),
];

export function getWorkoutCatalogSize() {
  return movements.length;
}

export function getWorkoutVisualIds() {
  return [...new Set(movements.map((item) => item.visualId))];
}

export function buildWorkoutPlan(input: WorkoutPlanInput): WorkoutSession[] {
  const seed = input.seed ?? new Date().toISOString().slice(0, 10);
  const defaultSessionCount = input.level === 'advanced' ? 5 : input.level === 'steady' ? 4 : 3;
  const sessionCount = input.daysPerWeek == null
    ? defaultSessionCount
    : Math.min(6, Math.max(2, Math.round(input.daysPerWeek)));
  const exerciseCount = input.durationMinutes <= 25 ? 4 : input.durationMinutes >= 55 ? 6 : 5;
  const templates = orderTemplatesForFocus(focusTemplates[input.category], input.weeklyFocus ?? 'momentum');
  const used = new Set<string>();
  const progression = progressionFor(seed, input.category, input.level);
  const pool = movements.filter((item) => item.category === input.category && levelRank(item.minLevel) <= levelRank(input.level));

  const selections = Array.from({ length: sessionCount }, (_, index) => {
    const template = templates[index % templates.length];
    const unusedPool = pool.filter((item) => !used.has(item.id));
    const candidatePool = unusedPool.length >= exerciseCount ? unusedPool : pool;
    const ordered = [...candidatePool].sort((left, right) => {
      const leftScore = movementScore(left, template.focus, input.level, used, `${seed}:${index}`);
      const rightScore = movementScore(right, template.focus, input.level, used, `${seed}:${index}`);
      return rightScore - leftScore;
    });
    const selected = ordered.slice(0, exerciseCount);
    selected.forEach((item) => used.add(item.id));

    return { template, selected };
  });

  const scheduledIds = new Set(selections.flatMap((selection) => selection.selected.map((item) => item.id)));

  return selections.map(({ template, selected }, index) => {
    return {
      id: `${seed}_${input.category}_${index + 1}`,
      title: template.title,
      focus: template.focus.map(titleCase).join(' + '),
      durationMinutes: input.durationMinutes,
      warmup: warmupFor(input.category, input.durationMinutes),
      exercises: selected.map((item, exerciseIndex) =>
        plannedExercise(item, input, progression.setAdjustment, pool, scheduledIds, exerciseIndex, `${seed}:${index}:${item.id}`),
      ),
      cooldown: cooldownFor(input.category),
      progression: progression.guidance,
    };
  });
}

function orderTemplatesForFocus(templates: FocusTemplate[], focus: WorkoutFocus) {
  if (focus === 'momentum') return templates;

  const preferredTags: Record<Exclude<WorkoutFocus, 'momentum'>, string[]> = {
    strength: ['hinge', 'push', 'pull', 'squat', 'strength'],
    mobility: ['mobility', 'recovery', 'technique'],
    energy: ['conditioning', 'speed', 'tempo', 'base', 'cadence'],
  };
  const tags = preferredTags[focus];
  return templates
    .map((template, index) => ({
      template,
      index,
      score: template.focus.reduce((total, tag) => total + (tags.includes(tag) ? tags.length - tags.indexOf(tag) : 0), 0),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ template }) => template);
}

function plannedExercise(
  item: Movement,
  input: WorkoutPlanInput,
  setAdjustment: number,
  pool: Movement[],
  scheduledIds: Set<string>,
  index: number,
  seed: string,
): PlannedExercise {
  const baseSets = input.durationMinutes <= 25 ? 2 : input.durationMinutes >= 55 ? 4 : 3;
  const levelSets = input.level === 'advanced' && index < 2 ? 1 : 0;
  const sets = Math.max(2, baseSets + levelSets + setAdjustment);
  const unscheduled = pool.filter((candidate) => !scheduledIds.has(candidate.id));
  const focusedAlternatives = unscheduled.filter((candidate) => candidate.focus.some((focus) => item.focus.includes(focus)));
  const alternatives = (focusedAlternatives.length > 0 ? focusedAlternatives : unscheduled)
    .sort((left, right) => {
      const focusDifference = right.focus.filter((focus) => item.focus.includes(focus)).length - left.focus.filter((focus) => item.focus.includes(focus)).length;
      if (focusDifference !== 0) return focusDifference;
      return stableIndex(`${seed}:${left.id}`, 101) - stableIndex(`${seed}:${right.id}`, 101);
    })
    .slice(0, 4)
    .map((candidate) => exerciseDetails(candidate, input, sets));
  const timedCategory = input.category === 'cardio' || input.category === 'cycling' || input.category === 'yoga';
  return {
    id: item.id,
    name: item.name,
    prescription: timedCategory ? item.reps[input.level] : `${sets} sets × ${item.reps[input.level]}`,
    cue: item.cue,
    equipment: item.equipment,
    visualId: item.visualId,
    alternatives,
  };
}

function exerciseDetails(item: Movement, input: WorkoutPlanInput, sets: number): PlannedExerciseAlternative {
  const timedCategory = input.category === 'cardio' || input.category === 'cycling' || input.category === 'yoga';
  return {
    id: item.id,
    name: item.name,
    prescription: timedCategory ? item.reps[input.level] : `${sets} sets × ${item.reps[input.level]}`,
    cue: item.cue,
    equipment: item.equipment,
    visualId: item.visualId,
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
  if (category === 'yoga') {
    if (weekIndex === 0) return { setAdjustment: 0, guidance: 'Use a range that lets you breathe without strain.' };
    if (weekIndex === 1) return { setAdjustment: 0, guidance: 'Add one slow breath to each hold when the position feels settled.' };
    if (weekIndex === 2) return { setAdjustment: 0, guidance: 'Move a little deeper only where your breath stays smooth.' };
    return { setAdjustment: 0, guidance: 'Keep this week gentle and use support whenever it helps you relax.' };
  }
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
  if (category === 'yoga') return `${minutes} min of easy breathing, wrist circles, and gentle spinal movement.`;
  return `${minutes} min joint prep, easy movement patterns, and two gradual practice sets.`;
}

function cooldownFor(category: WorkoutCategory) {
  if (category === 'cardio') return 'Walk until breathing settles, then loosen calves and hips.';
  if (category === 'cycling') return 'Spin easily for 3–5 minutes, then reset hips and upper back.';
  if (category === 'yoga') return 'Rest on your back for two minutes and let your breathing return to normal.';
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
  _legacyVisual: string,
): Movement {
  return { id, name, category, minLevel, focus, equipment, reps: { beginner: reps[0], steady: reps[1], advanced: reps[2] }, cue, visualId: visual(id) };
}

function yogaMovement(
  id: string,
  name: string,
  minLevel: WorkoutLevel,
  focus: string[],
  reps: [string, string, string],
  cue: string,
  visualId: string,
): Movement {
  return {
    id,
    name,
    category: 'yoga',
    minLevel,
    focus,
    equipment: ['bodyweight'],
    reps: { beginner: reps[0], steady: reps[1], advanced: reps[2] },
    cue,
    visualId,
  };
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
