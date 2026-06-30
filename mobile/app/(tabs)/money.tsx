import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { QuickActionTile } from '@/components/ui/QuickActionTile';
import { Chip } from '@/components/ui/Chip';
import { useWallet } from '@/hooks/useWallet';
import { useProductionStore, type Expense, type ExpenseCategory } from '@/stores/useProductionStore';
import { categoryMeta } from '@/lib/modulePresets';

const categories: ExpenseCategory[] = ['Needs', 'Wants', 'Savings', 'Emergencies'];

export default function MoneyScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, goals, bills, isLoading } = useWallet();
  const expenses = useProductionStore((s) => s.expenses);
  const budgets = useProductionStore((s) => s.budgets);
  const savingGoals = useProductionStore((s) => s.savingGoals);
  const prompts = useProductionStore((s) => s.expensePrompts.filter((prompt) => prompt.status === 'pending'));
  const addExpense = useProductionStore((s) => s.addExpense);
  const addSavingGoal = useProductionStore((s) => s.addSavingGoal);
  const addExpensePromptFromNotification = useProductionStore((s) => s.addExpensePromptFromNotification);
  const dismissExpensePrompt = useProductionStore((s) => s.dismissExpensePrompt);
  const logExpensePrompt = useProductionStore((s) => s.logExpensePrompt);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Needs');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const remoteTotal = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
  const localTotal = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const totalSpent = remoteTotal + localTotal;
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);

  const onAddExpense = () => {
    const parsedAmount = Number(amount);
    if (!merchant.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    addExpense({ merchant: merchant.trim(), amount: parsedAmount, category, note: note.trim() || undefined });
    setMerchant('');
    setAmount('');
    setNote('');
    setQuickAddOpen(false);
  };

  const onAddGoal = () => {
    const parsedTarget = Number(goalTarget);
    if (!goalName.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return;
    addSavingGoal(goalName.trim(), parsedTarget);
    setGoalName('');
    setGoalTarget('');
    setGoalOpen(false);
  };

  const onSimulateNotification = () => {
    addExpensePromptFromNotification('Bank notification', 'Card purchase of R189.90 at Checkers was approved');
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <SectionLabel>Money</SectionLabel>
            <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>
              Spending, quietly tracked
            </Text>
          </View>
          <Pressable onPress={() => setQuickAddOpen(true)} style={styles.headerAction} accessibilityRole="button">
            <Icon name="plus" color={palette.onPrimary} size={20} />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            <Card style={{ marginTop: spacing.lg }}>
              <View style={styles.monthSummary}>
                <View>
                  <SectionLabel>This month</SectionLabel>
                  <Text style={[type.displayMd, { color: palette.onSurface, marginTop: spacing.xs }]}>
                    R{totalSpent.toFixed(2)}
                  </Text>
                  <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
                    {transactions.length + expenses.length} transactions
                  </Text>
                </View>
                <View style={styles.budgetRing}>
                  <Text style={[type.titleMd, { color: palette.onSurface }]}>
                    {totalBudget ? Math.min(99, Math.round((totalSpent / totalBudget) * 100)) : 0}%
                  </Text>
                  <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>used</Text>
                </View>
              </View>
            </Card>

            <View style={styles.spaced}>
              <View style={styles.actionGrid}>
                <QuickActionTile icon="receipt" label="Add expense" detail="Amount first, details second" onPress={() => setQuickAddOpen(true)} />
                <QuickActionTile icon="camera" label="Receipt" detail="Attach photo stub" accent={palette.secondary} onPress={() => setQuickAddOpen(true)} />
              </View>
            </View>

            <View style={styles.spaced}>
              <View style={styles.sectionHeader}>
                <Text style={[type.headlineMd, { color: palette.onSurface }]}>Notification assist</Text>
                <Pressable onPress={onSimulateNotification}>
                  <Text style={[type.labelMd, { color: palette.primary }]}>Test</Text>
                </Pressable>
              </View>
              {prompts.length === 0 ? (
                <Card variant="recessed">
                  <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                    Bank notifications can become suggested transactions. You confirm before anything is logged.
                  </Text>
                </Card>
              ) : null}
              {prompts.map((prompt) => (
                <Card key={prompt.id} style={{ marginTop: spacing.sm }} variant="featured">
                  <View style={styles.promptTop}>
                    <View style={styles.categoryBadge}>
                      <Icon name="receipt" size={18} color={palette.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <SectionLabel>{prompt.sourceApp}</SectionLabel>
                      <Text style={[type.titleLg, { color: palette.onSurface, marginTop: 2 }]}>
                        {prompt.merchant} {prompt.amount ? `/ R${prompt.amount.toFixed(2)}` : ''}
                      </Text>
                      <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                        {Math.round(prompt.confidence * 100)} percent confidence
                      </Text>
                    </View>
                  </View>
                  <View style={styles.promptActions}>
                    <Pressable onPress={() => dismissExpensePrompt(prompt.id)} style={styles.secondaryButton}>
                      <Text style={[type.labelMd, { color: palette.onSurfaceVariant }]}>Dismiss</Text>
                    </Pressable>
                    <Pressable onPress={() => logExpensePrompt(prompt.id, 'Needs')} style={styles.primaryButtonInline}>
                      <Text style={[type.labelMd, { color: palette.onPrimary }]}>Log it</Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>

            <View style={styles.spaced}>
              <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Budgets</Text>
              <View style={styles.budgetGrid}>
                {budgets.map((budget) => {
                  const spent = expenses
                    .filter((expense) => expense.category === budget.category)
                    .reduce((sum, expense) => sum + expense.amount, 0);
                  return <BudgetCard key={budget.id} category={budget.category} spent={spent} limit={budget.limit} />;
                })}
              </View>
            </View>

            <View style={styles.spaced}>
              <View style={styles.sectionHeader}>
                <Text style={[type.headlineMd, { color: palette.onSurface }]}>Recent transactions</Text>
                <Pressable onPress={() => setQuickAddOpen(true)}>
                  <Text style={[type.labelMd, { color: palette.primary }]}>Add</Text>
                </Pressable>
              </View>
              {[...expenses].slice(0, 5).map((expense) => (
                <TransactionRow key={expense.id} expense={expense} />
              ))}
              {expenses.length === 0 ? (
                <Card variant="recessed">
                  <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                    No manual expenses yet. Add the next purchase while it is fresh.
                  </Text>
                </Card>
              ) : null}
            </View>

            <View style={styles.spaced}>
              <View style={styles.sectionHeader}>
                <Text style={[type.headlineMd, { color: palette.onSurface }]}>Saving goals</Text>
                <Pressable onPress={() => setGoalOpen(true)}>
                  <Text style={[type.labelMd, { color: palette.primary }]}>Add</Text>
                </Pressable>
              </View>
              {[...savingGoals, ...goals.map((goal) => ({
                id: goal.id,
                name: goal.name,
                targetAmount: goal.target_amount,
                currentAmount: goal.current_amount,
              }))].map((goal) => (
                <Card key={goal.id} style={{ marginTop: spacing.sm }}>
                  <View style={styles.budgetRow}>
                    <Text style={[type.labelMd, { color: palette.onSurface }]}>{goal.name}</Text>
                    <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>
                      R{goal.currentAmount} / R{goal.targetAmount}
                    </Text>
                  </View>
                  <ProgressBar value={goal.currentAmount} max={goal.targetAmount || 1} color={palette.tertiary} style={{ marginTop: spacing.xs }} />
                </Card>
              ))}
            </View>

            {bills.length > 0 && (
              <View style={styles.spaced}>
                <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Upcoming bills</Text>
                {bills.map((bill) => (
                  <Card key={bill.id} style={{ marginBottom: spacing.sm }}>
                    <View style={styles.budgetRow}>
                      <Text style={[type.labelMd, { color: palette.onSurface }]}>{bill.name}</Text>
                      <Text style={[type.bodyMd, { color: palette.onSurface }]}>R{bill.amount}</Text>
                    </View>
                    <Text style={[type.labelSm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                      Due on the {bill.due_day_of_month}th
                    </Text>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ActionSheet visible={quickAddOpen} onClose={() => setQuickAddOpen(false)} eyebrow="Quick capture" title="Log an expense">
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={palette.onSurfaceVariant}
          keyboardType="numeric"
          style={styles.amountInput}
        />
        <TextInput
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Merchant"
          placeholderTextColor={palette.onSurfaceVariant}
          style={styles.input}
        />
        <View style={styles.chipGrid}>
          {categories.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={category === item}
              accent={categoryMeta[item].color}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Note or receipt detail"
          placeholderTextColor={palette.onSurfaceVariant}
          style={styles.input}
        />
        <View style={styles.actionGrid}>
          <QuickActionTile icon="camera" label="Receipt photo" detail="Attach later" accent={palette.secondary} />
          <QuickActionTile icon="calendar" label="Date" detail="Today" accent={palette.primary} />
        </View>
        <Pressable onPress={onAddExpense} style={styles.primaryButton}>
          <Text style={[type.labelMd, { color: palette.onPrimary }]}>Log purchase</Text>
        </Pressable>
      </ActionSheet>

      <ActionSheet visible={goalOpen} onClose={() => setGoalOpen(false)} eyebrow="Saving goal" title="Add a target">
        <TextInput
          value={goalName}
          onChangeText={setGoalName}
          placeholder="Big purchase or safety net"
          placeholderTextColor={palette.onSurfaceVariant}
          style={styles.input}
        />
        <TextInput
          value={goalTarget}
          onChangeText={setGoalTarget}
          placeholder="Target amount"
          placeholderTextColor={palette.onSurfaceVariant}
          keyboardType="numeric"
          style={styles.input}
        />
        <Pressable onPress={onAddGoal} style={styles.primaryButton}>
          <Text style={[type.labelMd, { color: palette.onPrimary }]}>Add goal</Text>
        </Pressable>
      </ActionSheet>
    </>
  );
}

function BudgetCard({ category, spent, limit }: { category: ExpenseCategory; spent: number; limit: number }) {
  const meta = categoryMeta[category];
  return (
    <Card style={styles.budgetCard}>
      <View style={[styles.categoryBubble, { backgroundColor: `${meta.color}24` }]}>
        <Text style={[type.titleMd, { color: meta.color }]}>{meta.icon}</Text>
      </View>
      <Text style={[type.labelMd, { color: palette.onSurface, marginTop: spacing.sm }]}>{category}</Text>
      <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>{meta.prompt}</Text>
      <Text style={[type.titleMd, { color: palette.onSurface, marginTop: spacing.sm }]}>
        R{spent.toFixed(0)} / R{limit.toFixed(0)}
      </Text>
      <ProgressBar value={spent} max={limit || 1} color={meta.color} style={{ marginTop: spacing.sm }} />
    </Card>
  );
}

function TransactionRow({ expense }: { expense: Expense }) {
  const meta = categoryMeta[expense.category];
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={styles.transactionRow}>
        <View style={[styles.categoryBubbleSmall, { backgroundColor: `${meta.color}24` }]}>
          <Text style={[type.labelMd, { color: meta.color }]}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.titleMd, { color: palette.onSurface }]}>{expense.merchant}</Text>
          <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
            {expense.transactionDate} / {expense.category}
          </Text>
        </View>
        <Text style={[type.titleMd, { color: palette.error }]}>R{expense.amount.toFixed(2)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  headerAction: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  spaced: { marginTop: spacing.xl },
  monthSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  budgetRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHigh,
  },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  promptTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainerHighest,
  },
  promptActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceContainerHigh,
  },
  primaryButtonInline: {
    flex: 1,
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  budgetCard: { width: '48%', minWidth: 150 },
  categoryBubble: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBubbleSmall: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  amountInput: {
    ...type.displayLg,
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  input: {
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainer,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
