import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';
import { getAccounts } from '@/lib/api/accounts';
import { getTransactions } from '@/lib/api/transactions';
import { removeGmailToken } from '@/lib/api/gmail';
import { triggerGmailSync } from '@/lib/api/gmailSync';
import { useGmailAuth } from '@/lib/hooks/useGmailAuth';
import NetWorthCard from '@/components/cards/NetWorthCard';
import AccountCard from '@/components/cards/AccountCard';
import SpendingChart from '@/components/charts/SpendingChart';
import { colors } from '@/lib/theme';

export default function DashboardScreen() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const { user } = useAuthStore();
  const router = useRouter();
  const { isConnected: gmailConnected, isLoading: gmailAuthLoading, waitingForCode, connect: connectGmail, submitCode } = useGmailAuth(user?.uid);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [accountsData, transactionsResult] = await Promise.all([
        getAccounts(user.uid),
        getTransactions(user.uid, 10),
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsResult.transactions);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleConnectGmail = async () => {
    if (!user) return;

    try {
      await connectGmail();
    } catch (error: any) {
      Alert.alert(
        'Gmail Connection Failed',
        error.message || 'Failed to connect Gmail. Please check your OAuth configuration in .env file and Google Cloud Console.'
      );
    }
  };

  const handleSyncGmail = async () => {
    if (!user) return;

    if (!gmailConnected) {
      Alert.alert('Gmail Not Connected', 'Please connect your Gmail account first.');
      return;
    }

    setSyncing(true);
    try {
      await triggerGmailSync(user.uid);
      Alert.alert('Success', 'Gmail sync started. Transactions will be imported shortly.');
      setTimeout(() => {
        loadData();
      }, 3000);
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message || 'Failed to sync Gmail');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!user) return;

    Alert.alert(
      'Disconnect Gmail',
      'Are you sure you want to disconnect Gmail?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGmailToken(user.uid);
              Alert.alert('Success', 'Gmail disconnected successfully. Please reload the app.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to disconnect Gmail');
            }
          },
        },
      ]
    );
  };

  const netWorth = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit') {
      return sum + (acc.limit - acc.balance);
    }
    return sum + acc.balance;
  }, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
        </View>
        
        <NetWorthCard netWorth={netWorth} />

        {/* Gmail Sync Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gmail Sync</Text>
          {gmailConnected ? (
            <View>
              <Text style={styles.cardDescription}>
                ✅ Gmail is connected. Sync transactions automatically from your bank emails.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, { flex: 1 }]}
                  onPress={handleSyncGmail}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonTextWhite}>Sync Now</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton, { flex: 1, marginLeft: 12 }]}
                  onPress={handleDisconnectGmail}
                >
                  <Text style={styles.buttonTextGray}>
                    Disconnect
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.cardDescription}>
                Connect your Gmail to automatically import transactions from bank emails using AI.
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleConnectGmail}
                disabled={gmailAuthLoading}
              >
                {gmailAuthLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonTextWhite}>
                    🔗 Connect Gmail
                  </Text>
                )}
              </TouchableOpacity>
              
              {waitingForCode && (
                <View style={styles.codeInputContainer}>
                  <Text style={styles.codeInputLabel}>
                    Paste the authorization code from the browser URL:
                  </Text>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="4/0ASc3gC0R5Rbeiij..."
                    value={authCode}
                    onChangeText={setAuthCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.button, styles.successButton]}
                    onPress={() => {
                      submitCode(authCode);
                      setAuthCode('');
                    }}
                    disabled={gmailAuthLoading || !authCode}
                  >
                    {gmailAuthLoading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.buttonTextWhite}>Submit Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              
              <Text style={styles.helperText}>
                Securely connects via Google OAuth 2.0
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          {accounts.length === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(tabs)/accounts')}
            >
              <Text style={styles.addButtonText}>
                Add Your First Account
              </Text>
            </TouchableOpacity>
          ) : (
            accounts.slice(0, 3).map((account) => (
              <AccountCard key={account.id} account={account} />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Trends</Text>
          <SpendingChart transactions={transactions} />
        </View>

        <View style={[styles.section, { marginBottom: 24 }]}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No transactions yet
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.transactionMerchant}>
                      {transaction.merchant}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {transaction.category}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.type === 'debit'
                        ? styles.amountDebit
                        : styles.amountCredit
                    ]}
                  >
                    {transaction.type === 'debit' ? '-' : '+'}₹
                    {transaction.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.gray[900],
  },
  cardDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: colors.gray[200],
  },
  buttonTextWhite: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonTextGray: {
    color: colors.gray[700],
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.gray[900],
  },
  addButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  emptyText: {
    color: colors.gray[500],
    textAlign: 'center',
    fontSize: 18,
  },
  transactionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionMerchant: {
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.gray[900],
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: colors.gray[500],
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  amountDebit: {
    color: colors.danger[600],
  },
  amountCredit: {
    color: colors.accent[600],
  },
  helperText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  codeInputContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  codeInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray[900],
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  successButton: {
    backgroundColor: colors.accent[600],
    shadowColor: colors.accent[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
