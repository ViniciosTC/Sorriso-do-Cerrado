import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ATRASO_BUSCA_MS = 400;

export interface Filtros<O extends string = string> {
  busca: string;
  categorias: string[];
  precoMin: string;
  precoMax: string;
  ordem: O;
}

export function useBusca<T, O extends string>(
  endpoint: string,
  ordemInicial: O
) {
  const [filtrosIniciais] = useState<Filtros<O>>(() => ({
    busca: '',
    categorias: [],
    precoMin: '',
    precoMax: '',
    ordem: ordemInicial,
  }));
  const [filtros, setFiltros] = useState<Filtros<O>>(filtrosIniciais);
  const [itens, setItens] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const atualizarFiltro = <K extends keyof Filtros<O>>(
    chave: K,
    valor: Filtros<O>[K]
  ) => setFiltros((atuais) => ({ ...atuais, [chave]: valor }));

  const limparFiltros = () => setFiltros(filtrosIniciais);

  const temFiltrosAtivos =
    JSON.stringify(filtros) !== JSON.stringify(filtrosIniciais);

  useEffect(() => {
    let ativo = true;

    const temporizador = setTimeout(async () => {
      setCarregando(true);
      setErro('');

      try {
        const { data } = await axios.get<T[]>(`${API_URL}${endpoint}`, {
          params: {
            busca: filtros.busca.trim() || undefined,
            categoria: filtros.categorias.length
              ? filtros.categorias
              : undefined,
            precoMin: filtros.precoMin || undefined,
            precoMax: filtros.precoMax || undefined,
            ordem: filtros.ordem,
          },
          paramsSerializer: { indexes: null },
        });

        if (ativo) setItens(data);
      } catch (error) {
        console.error(`Erro ao buscar ${endpoint}:`, error);
        if (ativo) setErro('Não foi possível carregar os dados. Tente novamente.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }, ATRASO_BUSCA_MS);

    return () => {
      ativo = false;
      clearTimeout(temporizador);
    };
  }, [filtros, endpoint]);

  return {
    filtros,
    itens,
    carregando,
    erro,
    atualizarFiltro,
    limparFiltros,
    temFiltrosAtivos,
  };
}
