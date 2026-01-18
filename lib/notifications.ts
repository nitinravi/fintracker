import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  // Skip in Expo Go - notifications require development build
  if (__DEV__) {
    console.log('Push notifications require a development build in Expo Go');
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
  } catch (error) {
    console.warn('Could not get push token:', error);
  }

  return token;
};

export const scheduleBudgetAlert = async (
  accountName: string,
  category: string,
  spent: number,
  limit: number
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Budget Limit Exceeded',
      body: `${accountName} - ${category}: ₹${spent.toLocaleString()} / ₹${limit.toLocaleString()}`,
      data: { type: 'budget_exceeded', accountName, category },
    },
    trigger: null, // Show immediately
  });
};

export const scheduleLowBalanceAlert = async (
  accountName: string,
  balance: number,
  limit: number
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Low Balance Alert',
      body: `${accountName} has only ₹${balance.toLocaleString()} remaining (${((balance / limit) * 100).toFixed(1)}% of limit)`,
      data: { type: 'low_balance', accountName },
    },
    trigger: null,
  });
};

export const scheduleSIPMaturityReminder = async (
  investmentName: string,
  daysRemaining: number
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SIP Maturity Reminder',
      body: `${investmentName} will mature in ${daysRemaining} days`,
      data: { type: 'sip_maturity', investmentName },
    },
    trigger: { seconds: 60 * 60 * 24 * daysRemaining }, // Schedule for daysRemaining days
  });
};

export const scheduleTransactionImportComplete = async (count: number) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Gmail Sync Complete',
      body: `Successfully imported ${count} transaction${count !== 1 ? 's' : ''} from Gmail`,
      data: { type: 'gmail_sync', count },
    },
    trigger: null,
  });
};
