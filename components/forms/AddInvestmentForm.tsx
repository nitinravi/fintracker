import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { addInvestment } from '@/lib/api/investments';
import { colors } from '@/lib/theme';

interface AddInvestmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddInvestmentForm({ onSuccess, onCancel }: AddInvestmentFormProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'sip' | 'stock'>('sip');
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('');
  const [nav, setNav] = useState('');
  const [units, setUnits] = useState('');
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    if (!name) {
      Alert.alert('Error', 'Please enter investment name');
      return;
    }

    const amountNum = parseFloat(amount) || 0;
    const navNum = parseFloat(nav) || 0;
    const unitsNum = units ? parseFloat(units) : undefined;
    const installmentsNum = type === 'sip' && installments ? parseInt(installments) : undefined;

    if (amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (navNum <= 0) {
      Alert.alert('Error', 'Please enter a valid NAV/Price');
      return;
    }

    const calculatedUnits = unitsNum || (amountNum / navNum);
    const currentValue = navNum * calculatedUnits;

    setLoading(true);
    try {
      await addInvestment(user.uid, {
        name,
        type,
        amount: amountNum,
        installments: installmentsNum,
        nav: navNum,
        units: calculatedUnits,
        currentValue,
        symbol: symbol || undefined,
      });
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Investment</Text>
        <Text style={styles.subtitle}>Track your investments</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Investment Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., HDFC SIP, Reliance Stock"
            placeholderTextColor={colors.gray[400]}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'sip' && styles.typeButtonActive
              ]}
              onPress={() => setType('sip')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'sip' && styles.typeButtonTextActive
                ]}
              >
                SIP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'stock' && styles.typeButtonActive
              ]}
              onPress={() => setType('stock')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'stock' && styles.typeButtonTextActive
                ]}
              >
                Stock
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {type === 'sip' ? 'Monthly SIP Amount (₹)' : 'Investment Amount (₹)'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.gray[400]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {type === 'sip' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Number of Installments</Text>
            <TextInput
              style={styles.input}
              placeholder="24"
              placeholderTextColor={colors.gray[400]}
              value={installments}
              onChangeText={setInstallments}
              keyboardType="numeric"
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {type === 'sip' ? 'Current NAV (₹)' : 'Current Price (₹)'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.gray[400]}
            value={nav}
            onChangeText={setNav}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Units/Shares (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Auto-calculated if empty"
            placeholderTextColor={colors.gray[400]}
            value={units}
            onChangeText={setUnits}
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            If empty, will be calculated as Amount / NAV
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Symbol/Ticker (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., HDFC.NS, RELIANCE.NS"
            placeholderTextColor={colors.gray[400]}
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />
          <Text style={styles.helperText}>
            For auto price updates via Yahoo Finance
          </Text>
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
              {loading ? 'Adding...' : 'Add Investment'}
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
  helperText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
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
