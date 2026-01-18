import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet } from 'react-native';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>App preferences</Text>
        </View>

        {/* Theme Toggle */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.cardTitle}>Dark Mode</Text>
              <Text style={styles.cardDescription}>Toggle dark theme</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
              thumbColor={theme === 'dark' ? colors.white : colors.gray[100]}
            />
          </View>
        </View>

        {/* User Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userId}>User ID: {user?.uid}</Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoText}>
            Finance Tracker v1.0.0
          </Text>
          <Text style={styles.appInfoSubtext}>
            Built with Expo & Firebase
          </Text>
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
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.gray[900],
  },
  cardDescription: {
    fontSize: 14,
    color: colors.gray[600],
  },
  userEmail: {
    fontSize: 16,
    color: colors.gray[700],
    marginBottom: 8,
    fontWeight: '500',
  },
  userId: {
    fontSize: 12,
    color: colors.gray[500],
  },
  signOutButton: {
    backgroundColor: colors.danger[600],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: colors.danger[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signOutButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  appInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appInfoText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  appInfoSubtext: {
    fontSize: 12,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 8,
  },
});
