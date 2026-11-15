import React, { createContext, useContext, useEffect } from 'react';
import { useSession, signOut } from './auth-client';
import { useNotificacao } from '../context/notificacaoContext';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  papel?: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isArtisan: boolean;
  isUser: boolean;
  isPending: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const { mostrarNotificacao } = useNotificacao();

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        papel: (session.user as any).papel || 'cliente',
      }
    : null;

  const papelNormalizado = user?.papel?.trim().toLowerCase();
  const isAdmin = papelNormalizado === 'admin';
  const isArtisan =
    papelNormalizado === 'artisan' ||
    papelNormalizado === 'artesa' ||
    papelNormalizado === 'vendedor';
  const isUser = !isAdmin && !isArtisan;

  useEffect(() => {
    if (isPending) return;

    if (user) {
      sessionStorage.setItem('sessaoAtiva', 'true');
    } else if (sessionStorage.getItem('sessaoAtiva') === 'true') {
      sessionStorage.removeItem('sessaoAtiva');
      mostrarNotificacao(
        'O tempo da sua sessão acabou por inatividade ou expiração. Faça login novamente.',
        'aviso'
      );
    }
  }, [user, isPending, mostrarNotificacao]);

  const logout = async () => {
    sessionStorage.removeItem('sessaoAtiva');
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        isArtisan,
        isUser,
        isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}