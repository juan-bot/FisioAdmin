import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  fetchUserProfile,
  createUserProfile,
  isFirstUser,
  UserProfile,
} from '../firebase/db';
import { db } from '../firebase/config';
import { doc, updateDoc, query, where, limit, getDocs } from 'firebase/firestore';

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
  refreshProfile: () => Promise<void>;
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
             disabled: false,
             createdAt: new Date().toISOString(),
           };
           await createUserProfile(prof);
         }
         
         if (prof.displayName && prof.displayName !== fbUser.displayName) {
           await updateProfile(fbUser, { displayName: prof.displayName });
         }
        
        if (prof.deletedAt) {
          // Reactivate deleted account on sign-in (after password reset)
          await updateDoc(doc(db, 'users', fbUser.uid), {
            deletedAt: null,
            disabled: false,
            approved: false,
            role: 'pending',
            updatedAt: new Date().toISOString(),
          });
          prof.deletedAt = undefined;
          prof.disabled = false;
          prof.approved = false;
          prof.role = 'pending';
        }
        
        if (prof.disabled) {
          await signOut(auth);
          setProfile(null);
          setStatus('unauthenticated');
          setError('Tu cuenta está deshabilitada. Contacta al administrador.');
          return;
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
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const name = displayName || email.split('@')[0];
      await updateProfile(cred.user, { displayName: name });
      const first = await isFirstUser();
      const prof: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName: name,
        role: first ? 'admin' : 'pending',
        approved: first,
        disabled: false,
        createdAt: new Date().toISOString(),
        password,
      };
      await createUserProfile(prof);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        // Check if there's a deleted profile in Firestore
        const usersSnap = await getDocs(query(usersCol, where('email', '==', email), limit(1)));
        if (!usersSnap.empty) {
          const prof = usersSnap.docs[0].data() as UserProfile;
          if (prof.deletedAt) {
            // Send password reset email so user can set new password
            await sendPasswordResetEmail(auth, email);
            throw new Error('Esta cuenta fue eliminada. Se ha enviado un email para restablecer tu contraseña. Revisa tu bandeja de entrada y usa el enlace para entrar; tu cuenta se reactivará automáticamente.');
          }
        }
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchUserProfile(user.uid);
      if (prof) setProfile(prof);
    }
  };

  const isAdmin = status === 'authenticated' && profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, status, isAdmin, error, login, register, logout, refreshProfile }}>
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
