/* eslint-disable react/only-export-components -- provider and hook intentionally share one module */
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
import { repository } from '../data/repository';
import type { UserProfile } from '../types';

export type AuthStatus = 'loading' | 'unauthenticated' | 'pending' | 'authenticated';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  isAdmin: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
    const loadingFallback = window.setTimeout(() => {
      setStatus(current => current === 'loading' ? 'unauthenticated' : current);
    }, 6000);
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      window.clearTimeout(loadingFallback);
      setUser(fbUser);
      setError('');
      if (!fbUser) {
        setProfile(null);
        setStatus('unauthenticated');
        return;
      }
      try {
         let prof = await repository.fetchUserProfile(fbUser.uid);
         
         if (!prof) {
           prof = {
             uid: fbUser.uid,
             email: fbUser.email || '',
             displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Usuario'),
             role: 'pending',
             approved: false,
             disabled: false,
             createdAt: new Date().toISOString(),
           };
           await repository.createUserProfile(prof);
         }
         
         if (prof.displayName && prof.displayName !== fbUser.displayName) {
           await updateProfile(fbUser, { displayName: prof.displayName });
         }
        
        if (prof.disabled || prof.deletedAt) {
          await signOut(auth);
          setProfile(null);
          setStatus('unauthenticated');
          setError(prof.deletedAt ? 'Tu cuenta fue eliminada. Contacta al administrador.' : 'Tu cuenta está deshabilitada. Contacta al administrador.');
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
    return () => {
      window.clearTimeout(loadingFallback);
      unsub();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const name = displayName || email.split('@')[0];
    await updateProfile(cred.user, { displayName: name });
    const prof: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      role: 'pending',
      approved: false,
      disabled: false,
      createdAt: new Date().toISOString(),
    };
    await repository.createUserProfile(prof);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await repository.fetchUserProfile(user.uid);
      if (prof) setProfile(prof);
    }
  };

  const isAdmin = status === 'authenticated' && profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, status, isAdmin, error, login, register, resetPassword, logout, refreshProfile }}>
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
