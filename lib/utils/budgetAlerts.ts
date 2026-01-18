import { Account } from '@/lib/api/accounts';

export interface BudgetAlert {
  accountId: string;
  accountName: string;
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export const checkBudgetLimits = (accounts: Account[]): BudgetAlert[] => {
  const alerts: BudgetAlert[] = [];

  accounts.forEach((account) => {
    if (!account.categories) return;

    Object.entries(account.categories).forEach(([category, data]) => {
      const percentage = (data.spent / data.limit) * 100;
      let status: 'ok' | 'warning' | 'exceeded' = 'ok';

      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      alerts.push({
        accountId: account.id || '',
        accountName: account.name,
        category,
        limit: data.limit,
        spent: data.spent,
        percentage,
        status,
      });
    });
  });

  return alerts.filter(alert => alert.status !== 'ok');
};

export const checkLowBalance = (accounts: Account[]): Array<{ accountId: string; accountName: string; balance: number; limit: number; percentage: number }> => {
  const lowBalanceAlerts: Array<{ accountId: string; accountName: string; balance: number; limit: number; percentage: number }> = [];

  accounts.forEach((account) => {
    if (account.type === 'credit' && account.limit) {
      const usagePercentage = (account.balance / account.limit) * 100;
      if (usagePercentage >= 90) {
        lowBalanceAlerts.push({
          accountId: account.id || '',
          accountName: account.name,
          balance: account.balance,
          limit: account.limit,
          percentage: usagePercentage,
        });
      }
    }
  });

  return lowBalanceAlerts;
};
