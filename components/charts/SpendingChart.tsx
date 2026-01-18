import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '@/lib/api/transactions';
import { colors } from '@/lib/theme';

interface SpendingChartProps {
  transactions: Transaction[];
}

export default function SpendingChart({ transactions }: SpendingChartProps) {
  // Charts require react-native-reanimated which needs a dev build
  // Show simple text summary for now in Expo Go
  const monthlyData = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'debit') {
      const date = transaction.date instanceof Date 
        ? transaction.date 
        : new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += transaction.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const monthlyEntries = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6); // Last 6 months

  if (monthlyEntries.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>
          No spending data available
        </Text>
      </View>
    );
  }

  const totalSpending = monthlyEntries.reduce((sum, [, amount]) => sum + amount, 0);
  const avgSpending = totalSpending / monthlyEntries.length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Spending Summary</Text>
      <View style={styles.totalContainer}>
        <Text style={styles.label}>Total (Last 6 months)</Text>
        <Text style={styles.totalValue}>
          ₹{totalSpending.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.avgContainer}>
        <Text style={styles.label}>Average per month</Text>
        <Text style={styles.avgValue}>
          ₹{avgSpending.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownLabel}>Monthly breakdown:</Text>
        {monthlyEntries.map(([month, amount]) => {
          const [year, monthNum] = month.split('-');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return (
            <View key={month} style={styles.breakdownItem}>
              <Text style={styles.breakdownMonth}>
                {months[parseInt(monthNum) - 1]} {year}
              </Text>
              <Text style={styles.breakdownAmount}>
                ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.note}>
        Charts require a development build (Expo Go limitation)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  emptyText: {
    color: colors.gray[500],
    textAlign: 'center',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.gray[900],
  },
  totalContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  avgContainer: {
    marginBottom: 16,
  },
  avgValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  breakdownContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownMonth: {
    fontSize: 12,
    color: colors.gray[600],
  },
  breakdownAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[900],
  },
  note: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 12,
    fontStyle: 'italic',
  },
});
