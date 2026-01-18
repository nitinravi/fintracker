import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { getInvestments, Investment, deleteInvestment } from '@/lib/api/investments';
import AddInvestmentForm from '@/components/forms/AddInvestmentForm';
import { colors } from '@/lib/theme';

export default function InvestmentsScreen() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuthStore();

  const loadInvestments = async () => {
    if (!user) return;
    
    try {
      const investmentsData = await getInvestments(user.uid);
      setInvestments(investmentsData);
    } catch (error) {
      console.error('Error loading investments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, [user]);

  const handleDelete = async (investmentId: string) => {
    if (!user) return;
    
    try {
      await deleteInvestment(user.uid, investmentId);
      await loadInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    loadInvestments();
  };

  const calculateReturns = (investment: Investment) => {
    const totalInvested = investment.type === 'sip' && investment.installments
      ? investment.amount * investment.installments
      : investment.amount;
    const returns = investment.currentValue - totalInvested;
    const returnsPercentage = (returns / totalInvested) * 100;
    return { returns, returnsPercentage };
  };

  if (showAddForm) {
    return (
      <View style={styles.container}>
        <AddInvestmentForm
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
          <Text style={styles.title}>Investments</Text>
          <Text style={styles.subtitle}>Track your portfolio</Text>
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
          <Text style={styles.loadingText}>Loading investments...</Text>
        </View>
      ) : investments.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No investments yet. Add your first investment to track!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.emptyButtonText}>Add Investment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={investments}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => {
            const { returns, returnsPercentage } = calculateReturns(item);
            return (
              <View style={styles.cardContainer}>
                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.investmentName}>
                        {item.name}
                      </Text>
                      <Text style={styles.investmentType}>
                        {item.type} {item.symbol && `• ${item.symbol}`}
                      </Text>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={styles.currentValue}>
                        ₹{item.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Text>
                      <Text
                        style={[
                          styles.returns,
                          returns >= 0 ? styles.returnsPositive : styles.returnsNegative
                        ]}
                      >
                        {returns >= 0 ? '+' : ''}₹{returns.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        {' '}({returnsPercentage >= 0 ? '+' : ''}{returnsPercentage.toFixed(2)}%)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>NAV/Price</Text>
                      <Text style={styles.detailValue}>
                        ₹{item.nav.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                    {item.units && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Units</Text>
                        <Text style={styles.detailValue}>
                          {item.units.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    )}
                    {item.type === 'sip' && item.installments && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Monthly SIP</Text>
                        <Text style={styles.detailValue}>
                          ₹{item.amount.toLocaleString('en-IN')} × {item.installments}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={loading}
          onRefresh={loadInvestments}
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
    marginBottom: 16,
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
    marginBottom: 12,
  },
  investmentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  investmentType: {
    fontSize: 14,
    color: colors.gray[600],
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  returns: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  returnsPositive: {
    color: colors.accent[600],
  },
  returnsNegative: {
    color: colors.danger[600],
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.gray[600],
  },
  detailValue: {
    fontSize: 12,
    color: colors.gray[900],
    fontWeight: '600',
  },
});
