import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteJournalRecord, type JournalDeleteClient } from './journal';

test('synced journal deletion scopes the permanent delete to one entry ID', async () => {
  const calls: string[] = [];
  const client: JournalDeleteClient = {
    from: (table) => {
      calls.push(table);
      return {
        delete: () => ({
          eq: async (column, value) => {
            calls.push(`${column}:${value}`);
            return { error: null };
          },
        }),
      };
    },
  };

  await deleteJournalRecord(client, 'entry-1');
  assert.deepEqual(calls, ['journal_entries', 'id:entry-1']);
});

test('synced journal deletion surfaces provider errors', async () => {
  const client: JournalDeleteClient = {
    from: () => ({ delete: () => ({ eq: async () => ({ error: { message: 'denied' } }) }) }),
  };

  await assert.rejects(() => deleteJournalRecord(client, 'entry-1'), /denied/);
});
