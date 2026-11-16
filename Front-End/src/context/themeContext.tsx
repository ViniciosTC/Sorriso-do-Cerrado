import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

export type Tema = 'light' | 'dark';

interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
}

const CHAVE_TEMA = 'sorriso-do-cerrado-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function lerTemaSalvo(): Tema {
  return localStorage.getItem(CHAVE_TEMA) === 'dark' ? 'dark' : 'light';
}

function rotaDeAutenticacao(pathname: string) {
  const rota = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return rota === '/login' || rota === '/cadastro';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [tema, setTema] = useState<Tema>(lerTemaSalvo);
  const telaDeAutenticacao = rotaDeAutenticacao(pathname);

  useLayoutEffect(() => {
    const temaAplicado = telaDeAutenticacao ? 'light' : tema;
    document.documentElement.dataset.theme = temaAplicado;
    document.documentElement.style.colorScheme = temaAplicado;
  }, [tema, telaDeAutenticacao]);

  const alternarTema = useCallback(() => {
    const novoTema = tema === 'dark' ? 'light' : 'dark';
    localStorage.setItem(CHAVE_TEMA, novoTema);
    setTema(novoTema);
  }, [tema]);

  const valor = useMemo(() => ({ tema, alternarTema }), [tema, alternarTema]);

  return (
    <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
