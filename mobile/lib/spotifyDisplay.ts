export function describeListeningSignal(input: { trackCount: number; minutesListened: number }) {
  const isThin = input.trackCount < 3 || input.minutesListened < 10;
  return {
    isThin,
    copy: isThin ? 'Light listening today - best guess.' : 'Based on today\'s listening.',
  };
}

export function formatMoodHeadline(moodLabel: string, moodPhrase: string) {
  return {
    title: moodLabel,
    detail: moodPhrase ? `Soundtrack hint: ${moodPhrase}` : null,
  };
}
