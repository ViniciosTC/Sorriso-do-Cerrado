import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import PedidosArtesao from './pedidosArtesao';
import ConfiguracoesLojaArtesao from './configuracoesLojaArtesao';
import styles from './adminPainel.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type AbaPainel = 'resumo' | 'produtos' | 'pedidos' | 'configuracoes-loja';

interface Produto {
  id: number;
  nome: string;
  categoria?: string;
  preco: string | number;
}

interface SubcontaFinanceira {
  id: string;
  balance: {
    available: number;
    blocked: number;
  };
  devMode: boolean;
}

interface PedidoResumo {
  codigo: string;
  data: string;
  status: 'confirmada' | 'cancelada';
  cliente: string;
  total: number;
  repasse: number;
}

interface ConversaResumo {
  id: number;
  mensagensNaoLidas: number;
}

type PeriodoGrafico = '6m' | '30d';

interface PontoGrafico {
  chave: string;
  rotulo: string;
  total: number;
  quantidade: number;
}

const gerarSerieVendas = (
  pedidos: PedidoResumo[],
  periodo: PeriodoGrafico
): PontoGrafico[] => {
  const agora = new Date();
  const confirmados = pedidos.filter((p) => p.status !== 'cancelada');

  if (periodo === '6m') {
    const meses: PontoGrafico[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const chave = `${ref.getFullYear()}-${ref.getMonth()}`;
      const rotulo = ref
        .toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '');
      meses.push({ chave, rotulo, total: 0, quantidade: 0 });
    }

    for (const pedido of confirmados) {
      const d = new Date(pedido.data);
      if (Number.isNaN(d.getTime())) continue;
      const alvo = meses.find((m) => m.chave === `${d.getFullYear()}-${d.getMonth()}`);
      if (alvo) {
        alvo.total += Number(pedido.total || 0);
        alvo.quantidade += 1;
      }
    }
    return meses;
  }

  const hojeFim = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    23,
    59,
    59,
    999
  );
  const blocos: { inicio: number; fim: number; ponto: PontoGrafico }[] = [];

  for (let b = 5; b >= 0; b--) {
    const fimDia = new Date(hojeFim);
    fimDia.setDate(hojeFim.getDate() - b * 5);
    const inicioDia = new Date(fimDia);
    inicioDia.setDate(fimDia.getDate() - 4);
    inicioDia.setHours(0, 0, 0, 0);

    const rotulo = fimDia.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });

    blocos.push({
      inicio: inicioDia.getTime(),
      fim: fimDia.getTime(),
      ponto: {
        chave: `bloco-${b}`,
        rotulo,
        total: 0,
        quantidade: 0,
      },
    });
  }

  for (const pedido of confirmados) {
    const ts = new Date(pedido.data).getTime();
    if (Number.isNaN(ts)) continue;
    const bloco = blocos.find((item) => ts >= item.inicio && ts <= item.fim);
    if (bloco) {
      bloco.ponto.total += Number(pedido.total || 0);
      bloco.ponto.quantidade += 1;
    }
  }

  return blocos.map((b) => b.ponto);
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);

function AdminPainel() {
  const location = useLocation();

  const abasValidas: AbaPainel[] = [
    'resumo',
    'produtos',
    'pedidos',
    'configuracoes-loja',
  ];

  const abaDaUrl = new URLSearchParams(location.search).get('aba');
  const abaDoState = (location.state as { aba?: AbaPainel } | null)?.aba;

  const abaInicial: AbaPainel = abasValidas.includes(abaDaUrl as AbaPainel)
    ? (abaDaUrl as AbaPainel)
    : abasValidas.includes(abaDoState as AbaPainel)
      ? (abaDoState as AbaPainel)
      : 'resumo';

  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>(abaInicial);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [periodoGrafico, setPeriodoGrafico] = useState<PeriodoGrafico>('6m');
  const [barraAtiva, setBarraAtiva] = useState<string | null>(null);
  const [subconta, setSubconta] = useState<SubcontaFinanceira | null>(null);
  const [erroFinanceiro, setErroFinanceiro] = useState('');
  const [carregandoFinanceiro, setCarregandoFinanceiro] = useState(false);

  const { user, isArtisan } = useAuth();
  const navigate = useNavigate();
  const { mostrarNotificacao, confirmarAcao } = useNotificacao();

  const nomeVendedor = user?.name || 'Vendedor';

  const fetchProdutos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/produtos/meus', {
        withCredentials: true,
      });

      setProdutos(response.data);
    } catch (error: unknown) {
      console.error('Erro ao buscar produtos:', error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        mostrarNotificacao(
          'O tempo da sua sessão acabou. Por favor, faça login novamente para continuar.',
          'erro'
        );
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  useEffect(() => {
    let ativo = true;

    axios
      .get<PedidoResumo[]>(`${API_URL}/vendas/artesao`, {
        withCredentials: true,
      })
      .then(({ data }) => {
        if (ativo) setPedidos(data);
      })
      .catch((error: unknown) => {
        console.error('Erro ao buscar pedidos do resumo:', error);
      })
      .finally(() => {
        if (ativo) setCarregandoPedidos(false);
      });

    axios
      .get<ConversaResumo[]>(`${API_URL}/mensagens/conversas`, {
        withCredentials: true,
      })
      .then(({ data }) => {
        if (!ativo) return;
        const totalNaoLidas = data.reduce(
          (acc, conversa) => acc + Number(conversa.mensagensNaoLidas || 0),
          0
        );
        setMensagensNaoLidas(totalNaoLidas);
      })
      .catch((error: unknown) => {
        console.error('Erro ao buscar mensagens não lidas:', error);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!isArtisan) return;

    setCarregandoFinanceiro(true);
    axios
      .get<{ subconta: SubcontaFinanceira | null }>(
        `${API_URL}/usuarios/artesao`,
        { withCredentials: true }
      )
      .then(({ data }) => {
        setSubconta(data.subconta);
        if (!data.subconta) {
          setErroFinanceiro('Nenhuma subconta financeira está vinculada.');
        }
      })
      .catch((error: unknown) => {
        console.error('Erro ao consultar subconta do artesão:', error);
        setErroFinanceiro(
          'Não foi possível consultar os dados financeiros na AbacatePay.'
        );
      })
      .finally(() => setCarregandoFinanceiro(false));
  }, [isArtisan]);

  const handleExcluir = async (id: number) => {
    const confirmar = await confirmarAcao(
      'Tem certeza que deseja excluir este produto?'
    );

    if (confirmar) {
      try {
        await axios.delete(`http://localhost:3000/produtos/${id}`, {
          withCredentials: true,
        });

        mostrarNotificacao('Produto excluído com sucesso!', 'sucesso');
        fetchProdutos();
      } catch (error) {
        console.error('Erro ao excluir o produto:', error);
        mostrarNotificacao('Falha ao excluir o produto.', 'erro');
      }
    }
  };

  const agora = new Date();
  const pedidosNoMes = pedidos.filter((pedido) => {
    if (pedido.status === 'cancelada') return false;
    const dataPedido = new Date(pedido.data);
    return (
      !Number.isNaN(dataPedido.getTime()) &&
      dataPedido.getMonth() === agora.getMonth() &&
      dataPedido.getFullYear() === agora.getFullYear()
    );
  });

  const faturamentoMes = pedidosNoMes.reduce(
    (acc, pedido) => acc + Number(pedido.total || 0),
    0
  );
  const ultimosPedidos = pedidos.slice(0, 4);
  const serieGrafico = gerarSerieVendas(pedidos, periodoGrafico);
  const maiorValorGrafico = Math.max(...serieGrafico.map((p) => p.total), 0);
  const totalPeriodoGrafico = serieGrafico.reduce((acc, p) => acc + p.total, 0);
  const qtdPeriodoGrafico = serieGrafico.reduce(
    (acc, p) => acc + p.quantidade,
    0
  );
  const pontoEmFoco = serieGrafico.find((p) => p.chave === barraAtiva) ?? null;

  return (
    <div className={styles.paginaPainel}>
      <BarraNavegacao />

      <main className={styles.conteudoGeral}>
        <div className={styles.layoutPainel}>
          {/* Barra Lateral */}
          <aside className={styles.barraLateral}>
            <nav className={styles.menuLateral}>
              <button
                type="button"
                className={
                  abaAtiva === 'resumo'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('resumo')}
              >
                Resumo
              </button>

              <button
                type="button"
                className={
                  abaAtiva === 'produtos'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('produtos')}
              >
                Produtos
              </button>

              <button
                type="button"
                className={
                  abaAtiva === 'pedidos'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('pedidos')}
              >
                Pedidos
              </button>

              <button
                type="button"
                className={styles.itemMenu}
                onClick={() => navigate('/mensagens')}
              >
                Mensagens
              </button>

              <button
                type="button"
                className={
                  abaAtiva === 'configuracoes-loja'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('configuracoes-loja')}
              >
                Configurações da loja
              </button>
            </nav>
          </aside>

          {/* Área Principal */}
          <section className={styles.areaPrincipal}>
            {abaAtiva === 'resumo' && (
              <div>
                <div className={styles.painelHeader}>
                  <div className={styles.tituloContainer}>
                    <h1 className={styles.tituloPainel}>Gerenciar artesanato</h1>
                    <p className={styles.nomeVendedor}>{nomeVendedor}</p>
                  </div>

                  <div className={styles.acoesHeader}>
                    <Link
                      to="/admin/adicionar-produto"
                      className={styles.linkBotaoAdicionar}
                    >
                      <button type="button" className={styles.botaoAdicionar}>
                        Adicionar Novo Produto
                      </button>
                    </Link>
                    {isArtisan && (
                      <Link
                        to="/dados-recebimento"
                        className={`${styles.linkBotaoAdicionar} ${styles.botaoAdicionar}`}
                      >
                        Dados de recebimento
                      </Link>
                    )}
                  </div>
                </div>

                <div className={styles.gradeCardsResumo}>
                  <div className={styles.cardResumo}>
                    <span className={styles.tituloCardResumo}>
                      Vendas no mês
                    </span>
                    <strong className={styles.valorCardResumo}>
                      {carregandoPedidos ? '...' : formatarMoeda(faturamentoMes)}
                    </strong>
                    <span className={styles.detalheCardResumo}>
                      {carregandoPedidos
                        ? 'Carregando vendas...'
                        : `${pedidosNoMes.length} ${
                            pedidosNoMes.length === 1
                              ? 'pedido confirmado'
                              : 'pedidos confirmados'
                          } neste mês`}
                    </span>
                  </div>

                  <div className={styles.cardResumo}>
                    <span className={styles.tituloCardResumo}>
                      Produtos ativos
                    </span>
                    <strong className={styles.valorCardResumo}>
                      {produtos.length}
                    </strong>
                    <button
                      type="button"
                      className={styles.linkCardResumo}
                      onClick={() => setAbaAtiva('produtos')}
                    >
                      Gerenciar catálogo
                    </button>
                  </div>

                  <div className={styles.cardResumo}>
                    <span className={styles.tituloCardResumo}>
                      Mensagens
                    </span>
                    <strong className={styles.valorCardResumo}>
                      {mensagensNaoLidas}
                    </strong>
                    <button
                      type="button"
                      className={styles.linkCardResumo}
                      onClick={() => navigate('/mensagens')}
                    >
                      {mensagensNaoLidas === 0
                        ? 'Nenhuma pendente • Abrir chat'
                        : mensagensNaoLidas === 1
                          ? '1 não lida • Responder'
                          : `${mensagensNaoLidas} não lidas • Responder`}
                    </button>
                  </div>

                  {isArtisan && (
                    <div className={styles.cardResumo}>
                      <span className={styles.tituloCardResumo}>
                        Recebimentos AbacatePay
                      </span>
                      {subconta ? (
                        <>
                          <strong className={styles.valorCardResumo}>
                            {formatarMoeda(subconta.balance.available / 100)}
                          </strong>
                          <span className={styles.detalheCardResumo}>
                            Saldo disponível •{' '}
                            {subconta.devMode ? 'Modo de Teste' : 'Produção'}
                          </span>
                          <span className={styles.detalheCardResumo}>
                            Saldo bloqueado:{' '}
                            {formatarMoeda(subconta.balance.blocked / 100)}
                          </span>
                        </>
                      ) : (
                        <span className={styles.detalheCardResumo}>
                          {erroFinanceiro ||
                            (carregandoFinanceiro
                              ? 'Consultando saldo...'
                              : 'Saldo indisponível.')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.gradeSecoesResumo}>
                  <section className={styles.secaoResumo}>
                    <div className={styles.cabecalhoSecaoResumo}>
                      <div>
                        <h2>Últimos pedidos</h2>
                        <p>Acompanhe as vendas mais recentes da sua loja</p>
                      </div>
                      <button
                        type="button"
                        className={styles.linkCardResumo}
                        onClick={() => setAbaAtiva('pedidos')}
                      >
                        Ver todos
                      </button>
                    </div>

                    {carregandoPedidos ? (
                      <p className={styles.estadoVazioResumo}>
                        Carregando pedidos...
                      </p>
                    ) : ultimosPedidos.length === 0 ? (
                      <p className={styles.estadoVazioResumo}>
                        Você ainda não recebeu pedidos.
                      </p>
                    ) : (
                      <div className={styles.listaPedidosResumo}>
                        {ultimosPedidos.map((pedido) => (
                          <div
                            key={pedido.codigo}
                            className={styles.itemPedidoResumo}
                          >
                            <div className={styles.infoPedidoResumo}>
                              <strong>Pedido #{pedido.codigo}</strong>
                              <span>
                                {pedido.cliente} •{' '}
                                {new Date(pedido.data).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className={styles.valoresPedidoResumo}>
                              <strong>{formatarMoeda(Number(pedido.total || 0))}</strong>
                              <span
                                className={
                                  pedido.status === 'cancelada'
                                    ? styles.statusCanceladoResumo
                                    : styles.statusConfirmadoResumo
                                }
                              >
                                {pedido.status === 'cancelada'
                                  ? 'Cancelado'
                                  : 'Confirmado'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className={styles.secaoResumo}>
                    <div className={styles.cabecalhoSecaoResumo}>
                      <div>
                        <h2>Vendas ao longo do tempo</h2>
                        <p>
                          {pontoEmFoco
                            ? `${pontoEmFoco.rotulo}: ${formatarMoeda(pontoEmFoco.total)} (${pontoEmFoco.quantidade} ${pontoEmFoco.quantidade === 1 ? 'pedido' : 'pedidos'})`
                            : `Total no período: ${formatarMoeda(totalPeriodoGrafico)} (${qtdPeriodoGrafico} ${qtdPeriodoGrafico === 1 ? 'pedido' : 'pedidos'})`}
                        </p>
                      </div>

                      <div className={styles.filtrosGrafico}>
                        <button
                          type="button"
                          className={
                            periodoGrafico === '6m'
                              ? styles.botaoFiltroAtivo
                              : styles.botaoFiltro
                          }
                          onClick={() => {
                            setPeriodoGrafico('6m');
                            setBarraAtiva(null);
                          }}
                        >
                          6 meses
                        </button>
                        <button
                          type="button"
                          className={
                            periodoGrafico === '30d'
                              ? styles.botaoFiltroAtivo
                              : styles.botaoFiltro
                          }
                          onClick={() => {
                            setPeriodoGrafico('30d');
                            setBarraAtiva(null);
                          }}
                        >
                          30 dias
                        </button>
                      </div>
                    </div>

                    {carregandoPedidos ? (
                      <p className={styles.estadoVazioResumo}>
                        Carregando gráfico...
                      </p>
                    ) : (
                      <div
                        className={styles.graficoBarras}
                        role="img"
                        aria-label="Gráfico de vendas ao longo do tempo"
                      >
                        {serieGrafico.map((ponto) => {
                          const altura =
                            maiorValorGrafico > 0 && ponto.total > 0
                              ? Math.max((ponto.total / maiorValorGrafico) * 100, 8)
                              : 0;

                          return (
                            <div
                              key={ponto.chave}
                              className={styles.colunaGrafico}
                              onMouseEnter={() => setBarraAtiva(ponto.chave)}
                              onMouseLeave={() => setBarraAtiva(null)}
                            >
                              <span className={styles.valorBarraGrafico}>
                                {ponto.total > 0
                                  ? formatarMoeda(ponto.total)
                                  : '—'}
                              </span>
                              <div className={styles.trilhaBarraGrafico}>
                                <div
                                  className={styles.barraGrafico}
                                  style={{ height: `${altura}%` }}
                                />
                              </div>
                              <span className={styles.rotuloBarraGrafico}>
                                {ponto.rotulo}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}

            {abaAtiva === 'produtos' && (
              <div>
                <div className={styles.painelHeader}>
                  <div className={styles.tituloContainer}>
                    <h1 className={styles.tituloPainel}>Meus Produtos</h1>
                    <p className={styles.nomeVendedor}>
                      Gerencie os produtos cadastrados na loja
                    </p>
                  </div>

                  <Link
                    to="/admin/adicionar-produto"
                    className={styles.linkBotaoAdicionar}
                  >
                    <button type="button" className={styles.botaoAdicionar}>
                      Adicionar Novo Produto
                    </button>
                  </Link>
                </div>

                <div className={styles.containerTabela}>
                  <table className={styles.tabelaAdmin}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {produtos.length > 0 ? (
                        produtos.map((produto) => (
                          <tr key={produto.id}>
                            <td>#{produto.id}</td>
                            <td>{produto.nome}</td>
                            <td>{produto.categoria || '—'}</td>
                            <td>R$ {produto.preco}</td>
                            <td>
                              <Link to={`/admin/editar-produto/${produto.id}`}>
                                <button
                                  type="button"
                                  className={styles.botaoAcao}
                                >
                                  Editar
                                </button>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleExcluir(produto.id)}
                                className={`${styles.botaoAcao} ${styles.botaoExcluir}`}
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className={styles.mensagemVazia}>
                            Nenhum produto cadastrado no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {abaAtiva === 'pedidos' && <PedidosArtesao />}

            {abaAtiva === 'configuracoes-loja' && <ConfiguracoesLojaArtesao />}
          </section>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

export default AdminPainel;
