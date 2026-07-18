-- Migration 0004 — add reminder_hour / reminder_minute to profiles
--
-- Stores the user-chosen evening reminder time. Defaults to 21:00.
-- Written during onboarding (Ready screen) and rescheduled in settings (Phase 3).

alter table public.profiles
  add column if not exists reminder_hour   smallint not null default 21
    check (reminder_hour between 0 and 23),
  add column if not exists reminder_minute smallint not null default 0
    check (reminder_minute between 0 and 59);

-- No new tables → no RLS audit needed; existing profiles policies cover the new columns.
