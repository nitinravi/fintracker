import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { getTransactions, Transaction } from '@/lib/api/transactions';
import { getAccounts, Account } from '@/lib/api/accounts';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import { colors } from '@/lib/theme';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuthStore();

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [transactionsResult, accountsData] = await Promise.all([
        getTransactions(user.uid),
        getAccounts(user.uid),
      ]);
      setTransactions(transactionsResult.transactions);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    loadData();
  };

  if (showAddForm) {
    return (
      <View style={styles.container}>
        <AddTransactionForm
          accounts={accounts}
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>Track your spending</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No transactions yet. Add your first transaction!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.emptyButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => {
            const date = item.date instanceof Date 
              ? item.date 
              : new Date(item.date);
            const account = accounts.find(acc => acc.id === item.accountId);
            
            return (
              <View style={styles.cardContainer}>
                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.merchant}>
                        {item.merchant}
                      </Text>
                      <Text style={styles.category}>
                        {item.category}
                      </Text>
                      {account && (
                        <Text style={styles.accountName}>
                          {account.name}
                        </Text>
                      )}
                    </View>
                    <View style={styles.amountContainer}>
                      <Text
                        style={[
                          styles.amount,
                          item.type === 'debit' ? styles.debitAmount : styles.creditAmount
                        ]}
                      >
                        {item.type === 'debit' ? '-' : '+'}₹
                        {item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={styles.date}>
                        {date.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  {item.source === 'gmail' && (
                    <View style={styles.gmailBadgeContainer}>
                      <View style={styles.gmailBadge}>
                        <Text style={styles.gmailBadgeText}>📧 Imported from Gmail</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={loading}
          onRefresh={loadData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    color: colors.gray[600],
    marginTop: 4,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: colors.gray[500],
    fontSize: 16,
  },
  emptyText: {
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  emptyButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
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
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  merchant: {
    fontWeight: 'bold',
    color: colors.gray[900],
    fontSize: 20,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: colors.gray[600],
    textTransform: 'capitalize',
    fontWeight: '500',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 12,
    color: colors.gray[500],
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  debitAmount: {
    color: colors.danger[600],
  },
  creditAmount: {
    color: colors.accent[600],
  },
  date: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
    fontWeight: '500',
  },
  gmailBadgeContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  gmailBadge: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  gmailBadgeText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
  },
});
