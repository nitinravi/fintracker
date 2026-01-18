import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const triggerGmailSync = async (userId: string): Promise<void> => {
  // Create trigger document to start Cloud Function
  const triggerRef = doc(db, 'users', userId, 'gmailSync', 'trigger');
  await setDoc(triggerRef, {
    triggeredAt: Timestamp.now(),
    status: 'pending',
  });
};
