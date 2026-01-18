import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface GmailToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export const saveGmailToken = async (userId: string, token: GmailToken): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    gmailToken: token.accessToken,
    gmailRefreshToken: token.refreshToken,
    gmailTokenExpiresAt: token.expiresAt,
  }, { merge: true });
};

export const getGmailToken = async (userId: string): Promise<GmailToken | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  const data = userSnap.data();
  if (!data.gmailToken) {
    return null;
  }
  
  return {
    accessToken: data.gmailToken,
    refreshToken: data.gmailRefreshToken,
    expiresAt: data.gmailTokenExpiresAt,
  };
};

export const removeGmailToken = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    gmailToken: null,
    gmailRefreshToken: null,
    gmailTokenExpiresAt: null,
  }, { merge: true });
};
