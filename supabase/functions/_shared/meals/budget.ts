export interface PaidBudgetStore {
  getMonthlySpendUsd(): Promise<number>;
}

export interface PaidBudgetDecision {
  allowed: boolean;
  state: 'closed' | 'warning' | 'open';
  monthlyLimitUsd: number;
  spendUsd: number;
  percentUsed: number;
}

export class PaidBudgetCircuitBreaker {
  private readonly monthlyLimitUsd: number;
  private readonly store: PaidBudgetStore;

  constructor(options: { monthlyLimitUsd?: number; store: PaidBudgetStore }) {
    this.monthlyLimitUsd =
      Number.isFinite(options.monthlyLimitUsd) && (options.monthlyLimitUsd as number) > 0
        ? (options.monthlyLimitUsd as number)
        : 25;
    this.store = options.store;
  }

  async check(projectedCostUsd = 0): Promise<PaidBudgetDecision> {
    const spendUsd = Math.max(0, await this.store.getMonthlySpendUsd());
    const projectedSpendUsd = spendUsd + Math.max(0, projectedCostUsd);
    const percentUsed = Number(((projectedSpendUsd / this.monthlyLimitUsd) * 100).toFixed(2));
    const state = percentUsed >= 100 ? 'open' : percentUsed >= 80 ? 'warning' : 'closed';
    return {
      allowed: state !== 'open',
      state,
      monthlyLimitUsd: this.monthlyLimitUsd,
      spendUsd,
      percentUsed,
    };
  }
}
