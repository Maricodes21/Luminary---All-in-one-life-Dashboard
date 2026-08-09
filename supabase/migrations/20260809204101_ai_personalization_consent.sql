alter table public.integration_consents
  drop constraint if exists integration_consents_integration_check;

alter table public.integration_consents
  add constraint integration_consents_integration_check check (
    integration in (
      'spotify',
      'health_connect',
      'bank_notifications',
      'bank_link',
      'ai_personalization',
      'ai_journal_text',
      'ai_health',
      'ai_money'
    )
  );

comment on table public.integration_consents is
  'Versioned, user-scoped consent for integrations and optional AI context categories.';
