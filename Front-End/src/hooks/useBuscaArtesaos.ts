import { useBusca } from './useBusca';

export type OrdemArtesao = 'recentes' | 'antigos' | 'nome_az' | 'nome_za';

export interface ArtesaoBusca {
  id: string;
  nome: string;
  localizacao: string;
  especialidade: string;
  descricao: string;
}

export const OPCOES_ORDEM_ARTESAOS: { valor: OrdemArtesao; rotulo: string }[] = [
  { valor: 'recentes', rotulo: 'Cadastrados recentemente' },
  { valor: 'antigos', rotulo: 'Mais antigos' },
  { valor: 'nome_az', rotulo: 'Nome (A–Z)' },
  { valor: 'nome_za', rotulo: 'Nome (Z–A)' },
];

export function useBuscaArtesaos() {
  const { itens, ...busca } = useBusca<ArtesaoBusca, OrdemArtesao>(
    '/artesaos',
    'recentes'
  );

  return { artesaos: itens, ...busca };
}
