import { useBusca } from './useBusca';

export type Ordem = 'recentes' | 'antigos' | 'maior_preco' | 'menor_preco';

export interface ProdutoBusca {
  id: number;
  nome: string;
  preco: string | number;
  imagemURL?: string;
  categoria?: string;
  artesao?: string;
}

export const OPCOES_ORDEM_PRODUTOS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'recentes', rotulo: 'Adicionados recentemente' },
  { valor: 'antigos', rotulo: 'Mais antigos' },
  { valor: 'maior_preco', rotulo: 'Maior preço' },
  { valor: 'menor_preco', rotulo: 'Menor preço' },
];

export function useBuscaProdutos(artesaoId?: string) {
  const { itens, ...busca } = useBusca<ProdutoBusca, Ordem>(
    artesaoId
      ? `/produtos?artesaoId=${encodeURIComponent(artesaoId)}`
      : '/produtos',
    'recentes'
  );

  return { produtos: itens, ...busca };
}
