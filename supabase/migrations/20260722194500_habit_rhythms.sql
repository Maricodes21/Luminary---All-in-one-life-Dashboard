alter table public.habits add column if not exists category text;
alter table public.habits add column if not exists schedule_days smallint[] not null default '{0,1,2,3,4,5,6}';
alter table public.habits add column if not exists time_window text not null default 'anytime' check (time_window in ('morning', 'day', 'evening', 'anytime'));
alter table public.habits add column if not exists weekly_target smallint not null default 5 check (weekly_target between 1 and 7);
