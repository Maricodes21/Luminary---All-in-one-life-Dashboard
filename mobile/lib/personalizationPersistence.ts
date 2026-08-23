import type { NightlyReflection } from './personalization';
import { enqueue } from './offlineQueue';
import { supabase } from './supabase';

function payloadFor(reflection: NightlyReflection, userId: string) {
  return {
    id: reflection.id,
    user_id: userId,
    local_date: reflection.localDate,
    generated_at: reflection.generatedAt,
    model: reflection.model,
    theme: reflection.theme,
    reflection: reflection.reflection,
    question: reflection.question,
    evidence_categories: reflection.evidenceCategories,
    confidence: reflection.confidence,
    status: reflection.status === 'accepted' ? ('accepted' as const) : ('pending' as const),
  };
}

export async function persistReflection(reflection: NightlyReflection) {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.id) return;
  const payload = payloadFor(reflection, data.user.id);
  const { error } = await supabase.from('ai_reflections').upsert(payload);
  if (!error) return;
  await enqueue({
    type: 'ai_reflection',
    id: `reflection-upsert-${reflection.id}`,
    action: 'upsert',
    payload,
  });
}

export async function removePersistedReflection(reflection: NightlyReflection) {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.id) return;
  const payload = payloadFor(reflection, data.user.id);
  const { error } = await supabase
    .from('ai_reflections')
    .delete()
    .eq('id', reflection.id)
    .eq('user_id', data.user.id);
  if (!error) return;
  await enqueue({
    type: 'ai_reflection',
    id: `reflection-delete-${reflection.id}`,
    action: 'delete',
    payload,
  });
}

export async function loadPersistedReflections(): Promise<NightlyReflection[]> {
  const { data, error } = await supabase
    .from('ai_reflections')
    .select(
      'id,local_date,generated_at,model,theme,reflection,question,evidence_categories,confidence,status',
    )
    .order('local_date', { ascending: false })
    .limit(90);
  if (error) throw error;
  return (data ?? []).flatMap((row): NightlyReflection[] => {
    if (
      !row.id ||
      !row.local_date ||
      !row.generated_at ||
      !row.theme ||
      !row.reflection ||
      !row.question
    )
      return [];
    return [
      {
        id: String(row.id),
        localDate: String(row.local_date),
        generatedAt: String(row.generated_at),
        model: String(row.model ?? 'compact-ai'),
        theme: String(row.theme),
        reflection: String(row.reflection),
        question: String(row.question),
        evidenceCategories: Array.isArray(row.evidence_categories)
          ? row.evidence_categories.filter((item): item is string => typeof item === 'string')
          : [],
        confidence:
          typeof row.confidence === 'number' ? row.confidence : Number(row.confidence ?? 0),
        status: row.status === 'accepted' ? 'accepted' : 'pending',
      },
    ];
  });
}
