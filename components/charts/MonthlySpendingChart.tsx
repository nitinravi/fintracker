import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Transaction } from '@/lib/api/transactions';
import { colors } from '@/lib/theme';

interface MonthlySpendingChartProps {
  transactions: Transaction[];
}

export default function MonthlySpendingChart({ transactions }: MonthlySpendingChartProps) {
  // Group transactions by month
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
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  if (monthlyEntries.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>
          No spending data available
        </Text>
      </View>
    );
  }

  const maxAmount = Math.max(...monthlyEntries.map(e => e.amount));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monthly Spending</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartContainer}>
          {monthlyEntries.map(({ month, amount }) => {
            const [year, monthNum] = month.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const heightPercentage = (amount / maxAmount) * 100;
            return (
              <View key={month} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View style={styles.barBackground}>
                    <View
                      style={[styles.barFill, { height: `${heightPercentage}%` }]}
                    />
                  </View>
                  <Text style={styles.monthLabel}>
                    {months[parseInt(monthNum) - 1]}
                  </Text>
                  <Text style={styles.amountLabel}>
                    ₹{(amount / 1000).toFixed(0)}k
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  barWrapper: {
    width: 48,
    alignItems: 'center',
  },
  barBackground: {
    width: '100%',
    height: 150,
    backgroundColor: colors.gray[200],
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary[600],
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  monthLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 8,
    textAlign: 'center',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 4,
  },
  note: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 12,
    fontStyle: 'italic',
  },
});
