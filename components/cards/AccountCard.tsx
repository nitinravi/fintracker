import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { memo } from 'react';
import { useRouter } from 'expo-router';
import { Account } from '@/lib/api/accounts';
import { colors } from '@/lib/theme';

interface AccountCardProps {
  account: Account;
}

const AccountCard = memo(function AccountCard({ account }: AccountCardProps) {
  const router = useRouter();
  const isCredit = account.type === 'credit';
  const availableBalance = isCredit 
    ? (account.limit || 0) - account.balance 
    : account.balance;
  const usagePercentage = isCredit && account.limit
    ? (account.balance / account.limit) * 100
    : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage > 90) return colors.danger[500];
    if (percentage > 70) return '#f59e0b';
    return colors.primary[500];
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/accounts`)}
      activeOpacity={0.95}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountName}>
            {account.name}
          </Text>
          <Text style={styles.bankName}>{account.bank}</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balance}>
            ₹{availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
          {isCredit && account.limit && (
            <Text style={styles.limit}>
              of ₹{account.limit.toLocaleString('en-IN')}
            </Text>
          )}
        </View>
      </View>

      {isCredit && account.limit && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(usagePercentage, 100)}%`,
                  backgroundColor: getProgressColor(usagePercentage)
                }
              ]}
            />
          </View>
          <Text style={styles.usageText}>
            {usagePercentage.toFixed(1)}% used
          </Text>
        </View>
      )}

      {account.categories && Object.keys(account.categories).length > 0 && (
        <View style={styles.categoriesContainer}>
          {Object.entries(account.categories).slice(0, 2).map(([category, data]) => {
            const categoryUsage = (data.spent / data.limit) * 100;
            return (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryAmount}>
                    ₹{data.spent.toLocaleString()} / ₹{data.limit.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.categoryProgressBar}>
                  <View
                    style={[
                      styles.categoryProgressFill,
                      {
                        width: `${Math.min(categoryUsage, 100)}%`,
                        backgroundColor: getProgressColor(categoryUsage)
                      }
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accountName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  bankName: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  limit: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.gray[200],
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  usageText: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 8,
    fontWeight: '500',
  },
  categoriesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: colors.gray[700],
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  categoryProgressBar: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
  },
});

export default AccountCard;
