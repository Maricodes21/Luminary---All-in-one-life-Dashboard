export type JournalDeleteClient = {
  from: (table: 'journal_entries') => {
    delete: () => {
      eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function deleteJournalRecord(
  client: JournalDeleteClient,
  entryId: string,
): Promise<void> {
  const { error } = await client.from('journal_entries').delete().eq('id', entryId);
  if (error) throw new Error(error.message);
}

export type JournalEvidenceEntry = {
  writtenAt: string;
  title?: string | null;
  tags: string[];
  body?: string;
};
export type JournalPattern = {
  id: string;
  title: string;
  detail: string;
  evidence: string;
  windowLabel: string;
  confidence: number;
};

const promptLibrary = [
  'What did your body keep trying to tell you today?',
  'Name one thing that felt lighter than expected.',
  'What are you carrying into tomorrow?',
  'Where did you feel most like yourself?',
  'What took more energy than it deserved?',
  'What made the day feel a little more yours?',
  'Which moment would you handle differently next time?',
  'What did you need but not ask for?',
  'What felt steady today?',
  'What surprised you about your own reaction?',
  'What is still asking for your attention?',
  'Where did you feel most at ease?',
  'What can tomorrow inherit from today?',
  'What can stay here instead of following you to bed?',
  'Who or what helped you feel supported?',
  'What did you do even though it was difficult?',
  'What felt clear by the end of the day?',
  'What did you notice once things became quiet?',
  'What are you proud you made room for?',
  'What would make tomorrow feel kinder?',
] as const;

export function selectJournalPrompts(input: {
  now: Date;
  entries: JournalEvidenceEntry[];
  limit?: number;
}): string[] {
  const cooldownStart = input.now.getTime() - 14 * 86_400_000;
  const recentTitles = new Set(
    input.entries
      .filter((entry) => new Date(entry.writtenAt).getTime() >= cooldownStart)
      .map((entry) => entry.title?.trim())
      .filter(Boolean),
  );
  const recentTags = input.entries
    .slice(0, 8)
    .flatMap((entry) => entry.tags.map((tag) => tag.toLowerCase()));
  const contextual = promptLibrary.map((prompt) => ({
    prompt,
    score: promptScore(prompt, input.now, recentTags),
  }));
  const available = contextual.filter(({ prompt }) => !recentTitles.has(prompt));
  const pool = available.length >= (input.limit ?? 4) ? available : contextual;
  return pool
    .sort(
      (left, right) =>
        right.score - left.score ||
        stableNumber(`${dateKey(input.now)}:${left.prompt}`) -
          stableNumber(`${dateKey(input.now)}:${right.prompt}`),
    )
    .slice(0, input.limit ?? 4)
    .map(({ prompt }) => prompt);
}

export function deriveJournalPatterns(
  entries: JournalEvidenceEntry[],
  now = new Date(),
): JournalPattern[] {
  const windowStart = new Date(now.getTime() - 28 * 86_400_000);
  const recent = entries.filter((entry) => {
    const time = new Date(entry.writtenAt).getTime();
    return time >= windowStart.getTime() && time <= now.getTime();
  });
  if (recent.length < 3) return [];
  const patterns: JournalPattern[] = [];
  const tagCounts = count(
    recent.flatMap((entry) => [
      ...new Set(entry.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
    ]),
  );
  const topTag = [...tagCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0];
  if (topTag && topTag[1] >= 2)
    patterns.push({
      id: `tag:${topTag[0]}`,
      title: `“${sentenceCase(topTag[0])}” keeps returning`,
      detail: `This tag appears in ${topTag[1]} of your recent entries.`,
      evidence: `${topTag[1]} tagged entries`,
      windowLabel: 'Last 28 days',
      confidence: confidence(topTag[1], recent.length),
    });
  const buckets = count(recent.map((entry) => hourBucket(new Date(entry.writtenAt).getHours())));
  const topBucket = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topBucket && topBucket[1] >= 2)
    patterns.push({
      id: `time:${topBucket[0]}`,
      title: `You often write in the ${topBucket[0]}`,
      detail: `${topBucket[1]} recent entries were written in this part of the day.`,
      evidence: `${topBucket[1]} timestamps`,
      windowLabel: 'Last 28 days',
      confidence: confidence(topBucket[1], recent.length),
    });
  const days = new Set(recent.map((entry) => dateKey(new Date(entry.writtenAt))));
  if (days.size >= 3)
    patterns.push({
      id: 'frequency:writing-days',
      title: `${days.size} writing days in your recent window`,
      detail: 'This counts days with an entry, without judging gaps between them.',
      evidence: `${recent.length} entries across ${days.size} days`,
      windowLabel: 'Last 28 days',
      confidence: Math.min(0.95, 0.6 + days.size * 0.04),
    });
  return patterns.slice(0, 3);
}

function promptScore(prompt: string, now: Date, tags: string[]) {
  let score = stableNumber(`${dateKey(now)}:${prompt}`) % 100;
  if (now.getHours() >= 18 && /tomorrow|bed|quiet|end of the day/i.test(prompt)) score += 80;
  if (
    tags.some((tag) => ['tired', 'heavy', 'restless', 'anxious'].includes(tag)) &&
    /energy|kinder|ease|need/i.test(prompt)
  )
    score += 60;
  if (
    tags.some((tag) => ['proud', 'clear', 'calm'].includes(tag)) &&
    /proud|clear|steady|supported/i.test(prompt)
  )
    score += 60;
  return score;
}
function count(values: string[]) {
  const result = new Map<string, number>();
  values.forEach((value) => result.set(value, (result.get(value) ?? 0) + 1));
  return result;
}
function confidence(matches: number, total: number) {
  return Math.min(0.95, 0.5 + (matches / Math.max(total, 1)) * 0.42);
}
function hourBucket(hour: number) {
  return hour < 11 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function stableNumber(value: string) {
  return (
    Array.from(value).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0
  );
}
function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
