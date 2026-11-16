import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  isSuperAdmin: boolean;
  isArtisan: boolean;
  isUser: boolean;
  isPending: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const { mostrarNotificacao } = useNotificacao();
  const logoutManualRef = useRef(false);
  const [encerrandoSessao, setEncerrandoSessao] = useState(false);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        papel:
          (session.user as typeof session.user & { papel?: string }).papel ||
          'cliente',
      }
    : null;

  const papelNormalizado = user?.papel?.trim().toLowerCase();
  const isSuperAdmin = papelNormalizado === 'super_admin';
  const isAdmin = papelNormalizado === 'admin' || isSuperAdmin;
  const isArtisan =
    papelNormalizado === 'artisan' ||
    papelNormalizado === 'artesa' ||
    papelNormalizado === 'vendedor';
  const isUser = !isAdmin && !isArtisan;

  useEffect(() => {
    if (isPending) return;

    if (user && !logoutManualRef.current) {
      sessionStorage.setItem('sessaoAtiva', 'true');
    } else if (!user) {
      const sessaoAtiva = sessionStorage.getItem('sessaoAtiva') === 'true';
      sessionStorage.removeItem('sessaoAtiva');
      if (sessaoAtiva && !logoutManualRef.current) {
        mostrarNotificacao(
          'O tempo da sua sessão acabou por inatividade ou expiração. Faça login novamente.',
          'aviso'
        );
      }
      logoutManualRef.current = false;
      setEncerrandoSessao(false);
    }
  }, [user, isPending, mostrarNotificacao]);

  const logout = async () => {
    logoutManualRef.current = true;
    setEncerrandoSessao(true);
    sessionStorage.removeItem('sessaoAtiva');
    try {
      await signOut();
    } catch (error) {
      logoutManualRef.current = false;
      setEncerrandoSessao(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        logout,
        isAuthenticated: !!user && !encerrandoSessao,
        isAdmin,
        isSuperAdmin,
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