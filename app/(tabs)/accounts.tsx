import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';
import { getAccounts, deleteAccount, Account } from '@/lib/api/accounts';
import AccountCard from '@/components/cards/AccountCard';
import AddAccountForm from '@/components/forms/AddAccountForm';
import { colors } from '@/lib/theme';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const loadAccounts = async () => {
    if (!user) return;
    
    try {
      const accountsData = await getAccounts(user.uid);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const handleDelete = async (accountId: string) => {
    if (!user) return;
    
    try {
      await deleteAccount(user.uid, accountId);
      await loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    loadAccounts();
  };

  if (showAddForm) {
    return (
      <View style={styles.container}>
        <AddAccountForm
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
          <Text style={styles.title}>Accounts</Text>
          <Text style={styles.subtitle}>Manage your accounts</Text>
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
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      ) : accounts.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No accounts yet. Add your first account to get started!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.emptyButtonText}>Add Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <AccountCard account={item} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={loading}
          onRefresh={loadAccounts}
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
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 18,
  },
  emptyButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardContainer: {
    paddingHorizontal: 16,
  },
});
