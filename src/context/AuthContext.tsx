import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  fetchUserProfile,
  createUserProfile,
  isFirstUser,
  UserProfile,
} from '../firebase/db';

export type AuthStatus = 'loading' | 'unauthenticated' | 'pending' | 'authenticated';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  isAdmin: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setError('');
      if (!fbUser) {
        setProfile(null);
        setStatus('unauthenticated');
        return;
      }
      try {
        let prof = await fetchUserProfile(fbUser.uid);
        if (!prof) {
          const first = await isFirstUser();
          prof = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Usuario'),
            role: first ? 'admin' : 'pending',
            approved: first,
            createdAt: new Date().toISOString(),
          };
          await createUserProfile(prof);
        }
        if (!prof.approved) {
          setProfile(prof);
          setStatus('pending');
        } else {
          setProfile(prof);
          setStatus('authenticated');
        }
      } catch (err) {
        console.error('Error al cargar el perfil de usuario:', err);
        setError('No se pudo acceder a los datos. Verifica que las reglas de Firestore permitan lectura a usuarios autenticados.');
        setProfile(null);
        setStatus('unauthenticated');
      }
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const first = await isFirstUser();
    const prof: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName: displayName || email.split('@')[0],
      role: first ? 'admin' : 'pending',
      approved: first,
      createdAt: new Date().toISOString(),
    };
    await createUserProfile(prof);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = status === 'authenticated' && profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, status, isAdmin, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
