-- Cover foreign-key paths introduced by the signal and personalization slices.
create index if not exists signal_feedback_signal_user_idx
  on public.signal_feedback(signal_id, user_id);

create index if not exists user_context_facts_supersedes_idx
  on public.user_context_facts(supersedes_fact_id)
  where supersedes_fact_id is not null;
