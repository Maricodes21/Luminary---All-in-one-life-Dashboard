import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export type BudgetCategory = 'Needs' | 'Wants' | 'Savings' | 'Emergencies';

export type Transaction = {
  id: string;
  amount: number;
  category: BudgetCategory;
  note: string | null;
  transaction_date: string;
};

export type BudgetGoal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
};

export type BudgetBill = {
  id: string;
  name: string;
  amount: number;
  due_day_of_month: number;
};

export function useWallet() {
  const session = useAuthStore((s) => s.session);

  const transactionsQuery = useQuery({
    queryKey: ['wallet_transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      if (!session) return [];
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (error) throw new Error(error.message);
      return data as Transaction[];
    },
    enabled: !!session,
  });

  const goalsQuery = useQuery({
    queryKey: ['wallet_goals'],
    queryFn: async (): Promise<BudgetGoal[]> => {
      if (!session) return [];
      const { data, error } = await supabase.from('budget_goals').select('*');
      if (error) throw new Error(error.message);
      return data as BudgetGoal[];
    },
    enabled: !!session,
  });

  const billsQuery = useQuery({
    queryKey: ['wallet_bills'],
    queryFn: async (): Promise<BudgetBill[]> => {
      if (!session) return [];
      const { data, error } = await supabase.from('budget_bills').select('*');
      if (error) throw new Error(error.message);
      return data as BudgetBill[];
    },
    enabled: !!session,
  });

  return {
    transactions: transactionsQuery.data || [],
    goals: goalsQuery.data || [],
    bills: billsQuery.data || [],
    isLoading: transactionsQuery.isLoading || goalsQuery.isLoading || billsQuery.isLoading,
  };
}
