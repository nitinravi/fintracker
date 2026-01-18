import { View, Text, StyleSheet } from 'react-native';
import { memo } from 'react';
import { colors } from '@/lib/theme';

interface NetWorthCardProps {
  netWorth: number;
}

const NetWorthCard = memo(function NetWorthCard({ netWorth }: NetWorthCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Net Worth</Text>
      <Text style={styles.value}>
        ₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </Text>
      <Text style={styles.description}>Your total financial position</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary[600],
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9,
    fontWeight: '500',
  },
  value: {
    color: colors.white,
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: colors.primary[100],
    fontSize: 12,
  },
});

export default NetWorthCard;
