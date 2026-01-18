import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { updateAccountBalance } from './accounts';

export interface Transaction {
  id?: string;
  userId: string;
  accountId: string;
  date: Timestamp | Date;
  amount: number;
  type: 'debit' | 'credit';
  merchant: string;
  category: string;
  source: 'manual' | 'gmail';
  emailId?: string;
  createdAt?: Timestamp | Date;
}

export const getTransactions = async (
  userId: string,
  limitCount?: number,
  startAfter?: any
): Promise<{ transactions: Transaction[]; lastDoc: any }> => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  let q = query(transactionsRef, orderBy('date', 'desc'));
  
  if (limitCount) {
    q = query(transactionsRef, orderBy('date', 'desc'), limit(limitCount));
  }
  
  if (startAfter) {
    q = query(transactionsRef, orderBy('date', 'desc'), startAfter(startAfter), limit(limitCount || 20));
  } else if (!limitCount) {
    q = query(transactionsRef, orderBy('date', 'desc'));
  }
  
  const snapshot = await getDocs(q);
  const transactions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate() || new Date(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Transaction[];
  
  return {
    transactions,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
  };
};

export const addTransaction = async (
  userId: string,
  transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>
): Promise<string> => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const docRef = await addDoc(transactionsRef, {
    ...transaction,
    userId,
    date: transaction.date instanceof Date ? Timestamp.fromDate(transaction.date) : transaction.date,
    createdAt: Timestamp.now(),
  });

  // Update account balance
  await updateAccountBalance(userId, transaction.accountId, transaction.amount, transaction.type);

  return docRef.id;
};

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  updates: Partial<Transaction>
): Promise<void> => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  const updateData: any = { ...updates };
  
  if (updates.date instanceof Date) {
    updateData.date = Timestamp.fromDate(updates.date);
  }
  
  await updateDoc(transactionRef, updateData);
};

export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(transactionRef);
};
