export type JournalDeleteClient = {
  from: (table: 'journal_entries') => {
    delete: () => {
      eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function deleteJournalRecord(client: JournalDeleteClient, entryId: string): Promise<void> {
  const { error } = await client.from('journal_entries').delete().eq('id', entryId);
  if (error) throw new Error(error.message);
}
