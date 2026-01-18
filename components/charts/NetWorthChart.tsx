import { View, Text, StyleSheet } from 'react-native';
import { Account } from '@/lib/api/accounts';
import { Investment } from '@/lib/api/investments';
import { colors } from '@/lib/theme';

interface NetWorthChartProps {
  accounts: Account[];
  investments: Investment[];
}

export default function NetWorthChart({ accounts, investments }: NetWorthChartProps) {
  const accountTotal = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit') {
      return sum + (acc.limit - acc.balance);
    }
    return sum + acc.balance;
  }, 0);

  const investmentTotal = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const netWorth = accountTotal + investmentTotal;

  if (netWorth === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>
          No data available for net worth breakdown
        </Text>
      </View>
    );
  }

  const accountPercentage = (accountTotal / netWorth) * 100;
  const investmentPercentage = (investmentTotal / netWorth) * 100;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Net Worth Breakdown</Text>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Accounts</Text>
          <Text style={styles.sectionValue}>
            ₹{accountTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, styles.accountProgress, { width: `${accountPercentage}%` }]}
          />
        </View>
        <Text style={styles.percentage}>{accountPercentage.toFixed(1)}%</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabelBold}>Investments</Text>
          <Text style={styles.sectionValueBold}>
            ₹{investmentTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, styles.investmentProgress, { width: `${investmentPercentage}%` }]}
          />
        </View>
        <Text style={styles.percentage}>{investmentPercentage.toFixed(1)}%</Text>
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
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    color: colors.gray[700],
    fontSize: 16,
  },
  sectionLabelBold: {
    color: colors.gray[700],
    fontWeight: '600',
    fontSize: 16,
  },
  sectionValue: {
    fontWeight: '600',
    color: colors.gray[900],
    fontSize: 16,
  },
  sectionValueBold: {
    fontWeight: 'bold',
    color: colors.gray[900],
    fontSize: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.gray[200],
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  accountProgress: {
    backgroundColor: colors.primary[600],
  },
  investmentProgress: {
    backgroundColor: colors.accent[600],
  },
  percentage: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 8,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 12,
    fontStyle: 'italic',
  },
});
