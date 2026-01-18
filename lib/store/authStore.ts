import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initializeAuth: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  const initializeAuth = () => {
    set({ loading: true });
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', user.uid, 'profile', 'data');
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: user.displayName || '',
            email: user.email || '',
            currency: 'INR',
            createdAt: new Date(),
          });
        }
      }
      set({ user, loading: false });
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile
    const userRef = doc(db, 'users', user.uid, 'profile', 'data');
    await setDoc(userRef, {
      name,
      email,
      currency: 'INR',
      createdAt: new Date(),
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    set({ user: null });
  };

  return {
    user: null,
    loading: true,
    initializeAuth,
    signIn,
    signUp,
    signOut,
  };
});
