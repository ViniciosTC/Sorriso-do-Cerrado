import { useEffect, useState } from 'react';
import axios from 'axios';

export type Ordem = 'recentes' | 'antigos' | 'maior_preco' | 'menor_preco';

export interface Filtros {
  busca: string;
  categorias: string[];
  precoMin: string;
  precoMax: string;
  ordem: Ordem;
}

export interface ProdutoBusca {
  id: number;
  nome: string;
  preco: string | number;
  imagemURL?: string;
  categoria?: string;
  artesao?: string;
}

export const FILTROS_INICIAIS: Filtros = {
  busca: '',
  categorias: [],
  precoMin: '',
  precoMax: '',
  ordem: 'recentes',
};

const ATRASO_BUSCA_MS = 400;

export function useBuscaProdutos() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [produtos, setProdutos] = useState<ProdutoBusca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const atualizarFiltro = <K extends keyof Filtros>(
    chave: K,
    valor: Filtros[K]
  ) => setFiltros((atuais) => ({ ...atuais, [chave]: valor }));

  const limparFiltros = () => setFiltros(FILTROS_INICIAIS);

  const temFiltrosAtivos =
    JSON.stringify(filtros) !== JSON.stringify(FILTROS_INICIAIS);

  useEffect(() => {
    let ativo = true;

    const temporizador = setTimeout(async () => {
      setCarregando(true);
      setErro('');

      try {
        const { data } = await axios.get<ProdutoBusca[]>(
          'http://localhost:3000/produtos',
          {
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
          }
        );

        if (ativo) setProdutos(data);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        if (ativo) {
          setErro('Não foi possível carregar os produtos. Tente novamente.');
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }, ATRASO_BUSCA_MS);

    return () => {
      ativo = false;
      clearTimeout(temporizador);
    };
  }, [filtros]);

  return {
    filtros,
    produtos,
    carregando,
    erro,
    atualizarFiltro,
    limparFiltros,
    temFiltrosAtivos,
  };
}
