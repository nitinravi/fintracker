import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Investment {
  id?: string;
  userId: string;
  name: string;
  type: 'sip' | 'stock';
  amount: number;
  installments?: number;
  currentValue: number;
  nav: number;
  units?: number;
  symbol?: string;
  lastUpdated?: Timestamp | Date;
  createdAt?: Timestamp | Date;
}

export const getInvestments = async (userId: string): Promise<Investment[]> => {
  const investmentsRef = collection(db, 'users', userId, 'investments');
  const q = query(investmentsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    lastUpdated: doc.data().lastUpdated?.toDate(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Investment[];
};

export const addInvestment = async (
  userId: string,
  investment: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>
): Promise<string> => {
  const investmentsRef = collection(db, 'users', userId, 'investments');
  const docRef = await addDoc(investmentsRef, {
    ...investment,
    userId,
    lastUpdated: Timestamp.now(),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateInvestment = async (
  userId: string,
  investmentId: string,
  updates: Partial<Investment>
): Promise<void> => {
  const investmentRef = doc(db, 'users', userId, 'investments', investmentId);
  const updateData: any = { ...updates };
  
  if (updates.lastUpdated instanceof Date) {
    updateData.lastUpdated = Timestamp.fromDate(updates.lastUpdated);
  }
  
  await updateDoc(investmentRef, updateData);
};

export const deleteInvestment = async (
  userId: string,
  investmentId: string
): Promise<void> => {
  const investmentRef = doc(db, 'users', userId, 'investments', investmentId);
  await deleteDoc(investmentRef);
};
