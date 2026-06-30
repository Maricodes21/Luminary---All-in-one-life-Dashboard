import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useWallet } from '@/hooks/useWallet';
import { useProductionStore, type ExpenseCategory } from '@/stores/useProductionStore';

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
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Needs');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const remoteTotal = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
  const localTotal = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const totalSpent = remoteTotal + localTotal;

  const onAddExpense = () => {
    const parsedAmount = Number(amount);
    if (!merchant.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    addExpense({ merchant: merchant.trim(), amount: parsedAmount, category });
    setMerchant('');
    setAmount('');
  };

  const onAddGoal = () => {
    const parsedTarget = Number(goalTarget);
    if (!goalName.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return;
    addSavingGoal(goalName.trim(), parsedTarget);
    setGoalName('');
    setGoalTarget('');
  };

  const onSimulateNotification = () => {
    addExpensePromptFromNotification('Bank notification', 'Card purchase of R189.90 at Checkers was approved');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionLabel>Money</SectionLabel>
      <Text style={[type.displaySm, { color: palette.onSurface, marginTop: spacing.xs }]}>
        Your spending, quietly tracked
      </Text>

      {isLoading ? (
        <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <Card style={{ marginTop: spacing.lg }}>
            <SectionLabel>This month</SectionLabel>
            <Text style={[type.displayLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
              R{totalSpent.toFixed(2)}
            </Text>
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
              across {transactions.length + expenses.length} transactions
            </Text>
          </Card>

          <View style={styles.spaced}>
            <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Log an expense</Text>
            <Card>
              <TextInput
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Merchant"
                placeholderTextColor={palette.onSurfaceVariant}
                style={styles.input}
              />
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Amount"
                placeholderTextColor={palette.onSurfaceVariant}
                keyboardType="numeric"
                style={styles.input}
              />
              <View style={styles.chipGrid}>
                {categories.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[styles.choice, category === item && styles.choiceActive]}
                  >
                    <Text style={[type.labelMd, { color: category === item ? palette.onPrimary : palette.onSurfaceVariant }]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={onAddExpense} style={styles.primaryButton}>
                <Text style={[type.labelMd, { color: palette.onPrimary }]}>Log purchase</Text>
              </Pressable>
            </Card>
          </View>

          <View style={styles.spaced}>
            <View style={styles.sectionHeader}>
              <Text style={[type.headlineMd, { color: palette.onSurface }]}>Notification assist</Text>
              <Pressable onPress={onSimulateNotification}>
                <Text style={[type.labelMd, { color: palette.primary }]}>Test</Text>
              </Pressable>
            </View>
            <Card variant="recessed">
              <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>
                Android bank notifications will never auto-log. Luminary suggests a purchase, then waits for you.
              </Text>
            </Card>
            {prompts.map((prompt) => (
              <Card key={prompt.id} style={{ marginTop: spacing.sm }}>
                <SectionLabel>{prompt.sourceApp}</SectionLabel>
                <Text style={[type.titleLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
                  {prompt.merchant} {prompt.amount ? `/ R${prompt.amount.toFixed(2)}` : ''}
                </Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
                  Confidence {Math.round(prompt.confidence * 100)} percent. Confirm before it becomes a transaction.
                </Text>
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
            <Card>
              {budgets.map((budget) => {
                const spent = expenses
                  .filter((expense) => expense.category === budget.category)
                  .reduce((sum, expense) => sum + expense.amount, 0);
                return (
                  <View key={budget.id} style={{ marginBottom: spacing.md }}>
                    <View style={styles.budgetRow}>
                      <Text style={[type.labelMd, { color: palette.onSurface }]}>{budget.category}</Text>
                      <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>
                        R{spent.toFixed(0)} / R{budget.limit.toFixed(0)}
                      </Text>
                    </View>
                    <ProgressBar value={spent} max={budget.limit || 1} color={palette.primary} style={{ marginTop: spacing.xs }} />
                  </View>
                );
              })}
            </Card>
          </View>

          <View style={styles.spaced}>
            <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Saving goals</Text>
            <Card>
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
            </Card>
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

          <Card style={{ marginTop: spacing.xl }} variant="recessed">
            <SectionLabel>Money guidance</SectionLabel>
            <Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
              This is guidance, not financial advice. Start with what changed this week, then plan the next purchase
              before it surprises you.
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
  spaced: { marginTop: spacing.xl },
  input: {
    color: palette.onSurface,
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  choice: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceContainerHigh,
  },
  choiceActive: { backgroundColor: palette.primary },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
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
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
});
