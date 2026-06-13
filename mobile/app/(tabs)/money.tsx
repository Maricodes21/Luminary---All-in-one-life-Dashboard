import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radii, type } from '@luminary/design-system';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useWallet } from '@/hooks/useWallet';

export default function MoneyScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, goals, bills, isLoading } = useWallet();

  // Basic totals calculation
  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);

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
          {/* Monthly Overview */}
          <Card style={{ marginTop: spacing.lg }}>
            <SectionLabel>This Month</SectionLabel>
            <Text style={[type.displayLg, { color: palette.onSurface, marginTop: spacing.xs }]}>
              ${totalSpent.toFixed(2)}
            </Text>
            <Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>
              spent across {transactions.length} transactions
            </Text>
          </Card>

          {/* Categories */}
          <View style={styles.spaced}>
            <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Budgets</Text>
            <Card>
              <View style={styles.budgetRow}>
                <Text style={[type.labelMd, { color: palette.onSurface }]}>Needs</Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>$800 / $1200</Text>
              </View>
              <ProgressBar value={800} max={1200} color={palette.primary} style={{ marginTop: spacing.xs, marginBottom: spacing.md }} />
              
              <View style={styles.budgetRow}>
                <Text style={[type.labelMd, { color: palette.onSurface }]}>Wants</Text>
                <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>$300 / $400</Text>
              </View>
              <ProgressBar value={300} max={400} color={palette.secondary} style={{ marginTop: spacing.xs }} />
            </Card>
          </View>

          {/* Savings Goals */}
          <View style={styles.spaced}>
            <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Savings Goals</Text>
            {goals.length > 0 ? (
              goals.map((goal) => {
                return (
                  <Card key={goal.id} style={{ marginBottom: spacing.sm }}>
                    <View style={styles.budgetRow}>
                      <Text style={[type.labelMd, { color: palette.onSurface }]}>{goal.name}</Text>
                      <Text style={[type.bodySm, { color: palette.onSurfaceVariant }]}>
                        ${goal.current_amount} / ${goal.target_amount}
                      </Text>
                    </View>
                    <ProgressBar value={goal.current_amount} max={goal.target_amount || 1} color={palette.tertiary} style={{ marginTop: spacing.xs }} />
                  </Card>
                );
              })
            ) : (
              <Card variant="recessed">
                <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>No savings goals set.</Text>
              </Card>
            )}
          </View>

          {/* Upcoming Bills */}
          <View style={styles.spaced}>
            <Text style={[type.headlineMd, { color: palette.onSurface, marginBottom: spacing.sm }]}>Upcoming Bills</Text>
            {bills.length > 0 ? (
              bills.map((bill) => (
                <Card key={bill.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.budgetRow}>
                    <Text style={[type.labelMd, { color: palette.onSurface }]}>{bill.name}</Text>
                    <Text style={[type.bodyMd, { color: palette.onSurface }]}>${bill.amount}</Text>
                  </View>
                  <Text style={[type.labelSm, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
                    Due on the {bill.due_day_of_month}th
                  </Text>
                </Card>
              ))
            ) : (
              <Card variant="recessed">
                <Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>No upcoming bills.</Text>
              </Card>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  content: { paddingHorizontal: spacing.md },
  spaced: { marginTop: spacing.xl },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
});
