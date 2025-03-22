import React, { createContext, useContext } from 'react';
import { User } from './types';
import { useStore } from './store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useStore();

  const signIn = async (email: string, password: string) => {
    const user = state.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Користувача не знайдено');
    }
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
  };

  const signUp = async (email: string, password: string) => {
    if (state.users.some(u => u.email === email)) {
      throw new Error('Користувач вже існує');
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
    };
    dispatch({ type: 'ADD_USER', payload: newUser });
    dispatch({ type: 'SET_CURRENT_USER', payload: newUser });
  };

  const signOut = async () => {
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
  };

  return (
    <AuthContext.Provider value={{ 
      user: state.currentUser, 
      loading: false,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}