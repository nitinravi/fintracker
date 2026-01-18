import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { getAccounts, Account } from '@/lib/api/accounts';
import { getTransactions, Transaction } from '@/lib/api/transactions';
import { getInvestments, Investment } from '@/lib/api/investments';
import NetWorthChart from '@/components/charts/NetWorthChart';
import MonthlySpendingChart from '@/components/charts/MonthlySpendingChart';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors } from '@/lib/theme';

export default function ReportsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const { user } = useAuthStore();

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [accountsData, transactionsResult, investmentsData] = await Promise.all([
        getAccounts(user.uid),
        getTransactions(user.uid),
        getInvestments(user.uid),
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsResult.transactions);
      setInvestments(investmentsData);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filterTransactionsByDateRange = (txns: Transaction[]): Transaction[] => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return txns;
    }

    return txns.filter((txn) => {
      const txnDate = txn.date instanceof Date ? txn.date : new Date(txn.date);
      return txnDate >= startDate;
    });
  };

  const handleExportCSV = async () => {
    if (!user) return;

    try {
      const filteredTransactions = filterTransactionsByDateRange(transactions);
      
      const headers = 'Date,Merchant,Category,Amount,Type,Account\n';
      const rows = filteredTransactions.map((txn) => {
        const date = txn.date instanceof Date ? txn.date : new Date(txn.date);
        const account = accounts.find(acc => acc.id === txn.accountId);
        return `${date.toLocaleDateString('en-IN')},"${txn.merchant}","${txn.category}",${txn.amount},${txn.type},"${account?.name || 'Unknown'}"`;
      }).join('\n');

      const csvContent = headers + rows;
      const fileName = `transactions_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Export Complete', `File saved to: ${fileUri}`);
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Failed to export CSV');
    }
  };

  const filteredTransactions = filterTransactionsByDateRange(transactions);

  const netWorth = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit') {
      return sum + (acc.limit - acc.balance);
    }
    return sum + acc.balance;
  }, 0) + investments.reduce((sum, inv) => sum + inv.currentValue, 0);

  const totalDebits = filteredTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = filteredTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSpending = totalDebits - totalCredits;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Analyze your finances</Text>
        </View>

        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.dateRangeButton,
                dateRange === range && styles.dateRangeButtonActive
              ]}
              onPress={() => setDateRange(range)}
            >
              <Text
                style={[
                  styles.dateRangeText,
                  dateRange === range && styles.dateRangeTextActive
                ]}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Net Worth Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Net Worth</Text>
          <Text style={styles.netWorthValue}>
            ₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
          <NetWorthChart accounts={accounts} investments={investments} />
        </View>

        {/* Monthly Spending Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Trends</Text>
          <MonthlySpendingChart transactions={filteredTransactions} />
        </View>

        {/* Summary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Transactions</Text>
              <Text style={styles.summaryValue}>{filteredTransactions.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Debits</Text>
              <Text style={[styles.summaryValue, styles.summaryDebit]}>
                ₹{totalDebits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Credits</Text>
              <Text style={[styles.summaryValue, styles.summaryCredit]}>
                ₹{totalCredits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net Spending</Text>
              <Text style={styles.summaryValue}>
                ₹{netSpending.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportCSV}
        >
          <Text style={styles.exportButtonText}>
            Export CSV
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.gray[900],
  },
  subtitle: {
    color: colors.gray[600],
    fontSize: 16,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dateRangeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateRangeButtonActive: {
    backgroundColor: colors.primary[600],
  },
  dateRangeText: {
    fontWeight: 'bold',
    color: colors.gray[700],
  },
  dateRangeTextActive: {
    color: colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.gray[800],
  },
  netWorthValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: colors.gray[600],
    fontSize: 16,
  },
  summaryValue: {
    fontWeight: '600',
    color: colors.gray[900],
    fontSize: 16,
  },
  summaryDebit: {
    color: colors.danger[600],
  },
  summaryCredit: {
    color: colors.accent[600],
  },
  exportButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exportButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
