import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { addAccount } from '@/lib/api/accounts';
import { colors } from '@/lib/theme';

interface AddAccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddAccountForm({ onSuccess, onCancel }: AddAccountFormProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [type, setType] = useState<'bank' | 'credit'>('bank');
  const [balance, setBalance] = useState('');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    if (!name || !bank) {
      Alert.alert('Error', 'Please fill in name and bank');
      return;
    }

    const balanceNum = parseFloat(balance) || 0;
    const limitNum = type === 'credit' ? (parseFloat(limit) || 0) : undefined;

    if (type === 'credit' && !limitNum) {
      Alert.alert('Error', 'Please enter credit limit');
      return;
    }

    setLoading(true);
    try {
      const accountData: any = {
        name,
        bank,
        type,
        balance: balanceNum,
        categories: {},
      };
      
      // Only include limit for credit cards
      if (type === 'credit' && limitNum !== undefined) {
        accountData.limit = limitNum;
      }
      
      await addAccount(user.uid, accountData);
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Account</Text>
        <Text style={styles.subtitle}>Create a new bank account or credit card</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., HDFC Credit Card"
            placeholderTextColor={colors.gray[400]}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bank</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., HDFC, SBI, ICICI"
            placeholderTextColor={colors.gray[400]}
            value={bank}
            onChangeText={setBank}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'bank' && styles.typeButtonActive
              ]}
              onPress={() => setType('bank')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'bank' && styles.typeButtonTextActive
                ]}
              >
                Bank Account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'credit' && styles.typeButtonActive
              ]}
              onPress={() => setType('credit')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'credit' && styles.typeButtonTextActive
                ]}
              >
                Credit Card
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {type === 'credit' ? 'Current Balance' : 'Balance'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.gray[400]}
            value={balance}
            onChangeText={setBalance}
            keyboardType="numeric"
          />
        </View>

        {type === 'credit' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Credit Limit</Text>
            <TextInput
              style={styles.input}
              placeholder="50000"
              placeholderTextColor={colors.gray[400]}
              value={limit}
              onChangeText={setLimit}
              keyboardType="numeric"
            />
          </View>
        )}

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
              {loading ? 'Adding...' : 'Add Account'}
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
  typeButtonActive: {
    backgroundColor: colors.primary[600],
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
