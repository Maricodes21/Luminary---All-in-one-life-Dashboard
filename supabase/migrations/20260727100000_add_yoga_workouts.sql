alter table public.health_workouts
  drop constraint if exists health_workouts_workout_type_check;

alter table public.health_workouts
  add constraint health_workouts_workout_type_check
  check (workout_type in ('calisthenics', 'cardio', 'cycling', 'gym', 'yoga'));
