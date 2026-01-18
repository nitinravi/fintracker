import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Account {
  id?: string;
  userId: string;
  name: string;
  bank: string;
  type: 'bank' | 'credit';
  balance: number;
  limit?: number;
  categories?: {
    [key: string]: { limit: number; spent: number };
  };
  createdAt: Timestamp | Date;
}

export const getAccounts = async (userId: string): Promise<Account[]> => {
  const accountsRef = collection(db, 'users', userId, 'accounts');
  const q = query(accountsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Account[];
};

export const addAccount = async (userId: string, account: Omit<Account, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
  const accountsRef = collection(db, 'users', userId, 'accounts');
  const docRef = await addDoc(accountsRef, {
    ...account,
    userId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateAccount = async (userId: string, accountId: string, updates: Partial<Account>): Promise<void> => {
  const accountRef = doc(db, 'users', userId, 'accounts', accountId);
  await updateDoc(accountRef, updates);
};

export const deleteAccount = async (userId: string, accountId: string): Promise<void> => {
  const accountRef = doc(db, 'users', userId, 'accounts', accountId);
  await deleteDoc(accountRef);
};

export const updateAccountBalance = async (
  userId: string,
  accountId: string,
  amount: number,
  type: 'debit' | 'credit'
): Promise<void> => {
  const accountRef = doc(db, 'users', userId, 'accounts', accountId);
  const accountSnap = await getDocs(collection(db, 'users', userId, 'accounts'));
  const account = accountSnap.docs.find(d => d.id === accountId);
  
  if (account) {
    const currentBalance = account.data().balance;
    const newBalance = type === 'debit' 
      ? currentBalance - amount 
      : currentBalance + amount;
    
    await updateDoc(accountRef, { balance: newBalance });
  }
};
