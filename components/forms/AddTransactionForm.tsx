import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '@/lib/store/authStore';
import { addTransaction } from '@/lib/api/transactions';
import { Account } from '@/lib/api/accounts';
import { colors } from '@/lib/theme';

interface AddTransactionFormProps {
  accounts: Account[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddTransactionForm({ accounts, onSuccess, onCancel }: AddTransactionFormProps) {
  const { user } = useAuthStore();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [category, setCategory] = useState('food');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const categories = [
    'food',
    'transport',
    'shopping',
    'bills',
    'entertainment',
    'healthcare',
    'education',
    'other',
  ];

  const handleSubmit = async () => {
    if (!user) return;

    if (!merchant || !amount || !accountId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const selectedAccount = accounts.find(acc => acc.id === accountId);
    if (!selectedAccount) {
      Alert.alert('Error', 'Please select an account');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addTransaction(user.uid, {
        accountId,
        merchant,
        amount: amountNum,
        type,
        category,
        date: new Date(date),
        source: 'manual',
      });
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Please add an account first before adding transactions.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Transaction</Text>
        <Text style={styles.subtitle}>Record a new transaction</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={accountId}
              onValueChange={setAccountId}
              style={styles.picker}
            >
              <Picker.Item label="Select an account" value="" />
              {accounts.map((account) => (
                <Picker.Item
                  key={account.id}
                  label={`${account.name} (${account.bank})`}
                  value={account.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Merchant/Description</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Swiggy, Uber, Amazon"
            placeholderTextColor={colors.gray[400]}
            value={merchant}
            onChangeText={setMerchant}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.gray[400]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'debit' && styles.typeButtonDebitActive
              ]}
              onPress={() => setType('debit')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'debit' && styles.typeButtonTextActive
                ]}
              >
                Debit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'credit' && styles.typeButtonCreditActive
              ]}
              onPress={() => setType('credit')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'credit' && styles.typeButtonTextActive
                ]}
              >
                Credit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item
                  key={cat}
                  label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                  value={cat}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Transaction'}
            </Text>
          </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  backButton: {
    backgroundColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButtonText: {
    fontWeight: 'bold',
    color: colors.gray[700],
    fontSize: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.gray[900],
  },
  subtitle: {
    color: colors.gray[600],
    marginBottom: 24,
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: colors.gray[700],
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.gray[900],
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonDebitActive: {
    backgroundColor: colors.danger[600],
  },
  typeButtonCreditActive: {
    backgroundColor: colors.accent[600],
  },
  typeButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.gray[700],
    fontSize: 16,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  submitButton: {
    backgroundColor: colors.primary[600],
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.gray[700],
    fontSize: 16,
  },
  submitButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.white,
    fontSize: 16,
  },
});
