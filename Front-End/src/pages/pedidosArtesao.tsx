import { useEffect, useMemo, useState } from 'react';
import styles from './pedidosArtesao.module.css';

type StatusPedido =
  | 'em_producao'
  | 'pronto_entrega'
  | 'entregue'
  | 'cancelado';

interface ItemPedido {
  nome: string;
  quantidade: number;
  valor: number;
}

interface AtualizacaoStatus {
  descricao: string;
  data: string;
}

interface Pedido {
  codigo: string;
  data: string;
  status: StatusPedido;
  cliente: string;
  email: string;
  telefone: string;
  itens: ItemPedido[];
  total: number;
  previsao?: string;
  historico: AtualizacaoStatus[];
}

const pedidos: Pedido[] = [];

const rotuloStatus: Record<StatusPedido, string> = {
  em_producao: 'Em produção',
  pronto_entrega: 'Para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

const classeStatus: Record<StatusPedido, string> = {
  em_producao: 'statusProducao',
  pronto_entrega: 'statusEntrega',
  entregue: 'statusEntregue',
  cancelado: 'statusCancelado',
};

const formatarData = (valor: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(valor));

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);

function IlustracaoProduto({ pequena = false }: { pequena?: boolean }) {
  return (
    <div
      className={pequena ? styles.imagemProdutoPequena : styles.imagemProduto}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M17 25h30l-3 27H20l-3-27Z" />
        <path d="M13 25h38M24 25l4-12h8l4 12M25 35c4 3 10 3 14 0" />
        <path d="M32 13V8m0 0c-4 0-6 2-6 5m6-5c4 0 6 2 6 5" />
      </svg>
    </div>
  );
}

function PedidosArtesao() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [pagina, setPagina] = useState(1);
  const [entregaAtual, setEntregaAtual] = useState(0);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const porPagina = 5;

  const pedidosParaEntrega = useMemo(
    () => pedidos.filter((pedido) => pedido.status === 'pronto_entrega'),
    [],
  );

  const pedidosFiltrados = useMemo(() => {
    const consulta = busca.trim().toLocaleLowerCase('pt-BR');
    const agora = new Date();
    const dataLimite =
      filtroPeriodo === '7'
        ? new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
        : filtroPeriodo === '30'
          ? new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
          : null;

    const filtrados = pedidos.filter((pedido) => {
      const correspondeBusca =
        !consulta ||
        pedido.codigo.toLocaleLowerCase('pt-BR').includes(consulta) ||
        pedido.cliente.toLocaleLowerCase('pt-BR').includes(consulta) ||
        pedido.itens.some((item) =>
          item.nome.toLocaleLowerCase('pt-BR').includes(consulta),
        );
      const correspondeStatus =
        filtroStatus === 'todos' || pedido.status === filtroStatus;
      const correspondePeriodo =
        !dataLimite || new Date(pedido.data) >= dataLimite;

      return correspondeBusca && correspondeStatus && correspondePeriodo;
    });

    return filtrados.sort((pedidoA, pedidoB) => {
      if (ordenacao === 'antigos') {
        return new Date(pedidoA.data).getTime() - new Date(pedidoB.data).getTime();
      }
      if (ordenacao === 'maior_valor') return pedidoB.total - pedidoA.total;
      if (ordenacao === 'menor_valor') return pedidoA.total - pedidoB.total;
      return new Date(pedidoB.data).getTime() - new Date(pedidoA.data).getTime();
    });
  }, [busca, filtroStatus, filtroPeriodo, ordenacao]);

  const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / porPagina));
  const pedidosDaPagina = pedidosFiltrados.slice(
    (pagina - 1) * porPagina,
    pagina * porPagina,
  );
  const entregaEmDestaque = pedidosParaEntrega[entregaAtual];

  useEffect(() => {
    setPagina((paginaAtual) => Math.min(paginaAtual, totalPaginas));
  }, [totalPaginas]);

  useEffect(() => {
    if (!pedidoSelecionado) return;
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPedidoSelecionado(null);
    };
    window.addEventListener('keydown', fecharComEsc);
    return () => window.removeEventListener('keydown', fecharComEsc);
  }, [pedidoSelecionado]);

  const indicadores = [
    { titulo: 'Total de pedidos', quantidade: pedidos.length, classe: styles.indicadorTotal },
    {
      titulo: 'Em produção',
      quantidade: pedidos.filter((pedido) => pedido.status === 'em_producao').length,
      classe: styles.indicadorProducao,
    },
    { titulo: 'Para entrega', quantidade: pedidosParaEntrega.length, classe: styles.indicadorEntrega },
    {
      titulo: 'Entregues',
      quantidade: pedidos.filter((pedido) => pedido.status === 'entregue').length,
      classe: styles.indicadorEntregue,
    },
    {
      titulo: 'Cancelados',
      quantidade: pedidos.filter((pedido) => pedido.status === 'cancelado').length,
      classe: styles.indicadorCancelado,
    },
  ];

  return (
    <div className={styles.paginaPedidos}>
      <header className={styles.cabecalho}>
        <div>
          <p className={styles.sobretitulo}>Sua loja</p>
          <h1>Pedidos</h1>
          <p className={styles.descricao}>Acompanhe e gerencie os pedidos da sua loja.</p>
        </div>
      </header>

      <section className={styles.secaoDashboard} aria-label="Resumo dos pedidos">
        <div className={styles.gradeIndicadores}>
          {indicadores.map((indicador) => (
            <article
              className={`${styles.cardIndicador} ${indicador.classe}`}
              key={indicador.titulo}
            >
              <span>{indicador.titulo}</span>
              <strong>{indicador.quantidade}</strong>
            </article>
          ))}
        </div>

        <section className={styles.destaqueEntrega} aria-labelledby="titulo-entrega">
          <div className={styles.cabecalhoEntrega}>
            <div>
              <p className={styles.sobretitulo}>Próximo passo</p>
              <h2 id="titulo-entrega">Pedidos para entrega</h2>
            </div>
            {pedidosParaEntrega.length > 0 && (
              <span className={styles.contadorEntrega}>
                {entregaAtual + 1} de {pedidosParaEntrega.length}
              </span>
            )}
          </div>

          {entregaEmDestaque ? (
            <article className={styles.pedidoEntrega} key={entregaEmDestaque.codigo}>
              <IlustracaoProduto />
              <div className={styles.dadosEntrega}>
                <span className={styles.codigoPedido}>Pedido #{entregaEmDestaque.codigo}</span>
                <h3>{entregaEmDestaque.itens[0].nome}</h3>
                <p>Cliente: {entregaEmDestaque.cliente}</p>
                <div className={styles.resumoEntrega}>
                  <span>Qtd. {entregaEmDestaque.itens[0].quantidade}</span>
                  <strong>{formatarMoeda(entregaEmDestaque.total)}</strong>
                  {entregaEmDestaque.previsao && (
                    <span>Previsão: {formatarData(entregaEmDestaque.previsao)}</span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.botaoVerPedido}
                  onClick={() => setPedidoSelecionado(entregaEmDestaque)}
                >
                  Ver pedido
                </button>
              </div>
            </article>
          ) : (
            <div className={styles.estadoVazioEntrega}>
              <span className={styles.iconePacote} aria-hidden="true">
                <IlustracaoProduto pequena />
              </span>
              <h3>Tudo em dia!</h3>
              <p>Não há pedidos para entregar no momento.</p>
            </div>
          )}

          {pedidosParaEntrega.length > 1 && (
            <div className={styles.controlesEntrega}>
              <button
                type="button"
                aria-label="Pedido para entrega anterior"
                onClick={() =>
                  setEntregaAtual(
                    (atual) => (atual - 1 + pedidosParaEntrega.length) % pedidosParaEntrega.length,
                  )
                }
              >
                ‹
              </button>
              <div className={styles.pontosEntrega} aria-hidden="true">
                {pedidosParaEntrega.map((pedido, index) => (
                  <span
                    className={index === entregaAtual ? styles.pontoAtivo : ''}
                    key={pedido.codigo}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Próximo pedido para entrega"
                onClick={() =>
                  setEntregaAtual((atual) => (atual + 1) % pedidosParaEntrega.length)
                }
              >
                ›
              </button>
            </div>
          )}
        </section>
      </section>

      <section className={styles.secaoTodosPedidos} aria-labelledby="titulo-todos-pedidos">
        <div className={styles.cabecalhoLista}>
          <div>
            <h2 id="titulo-todos-pedidos">Todos os pedidos</h2>
            <p>{pedidosFiltrados.length} pedidos encontrados</p>
          </div>
        </div>

        <div className={styles.filtrosPedidos}>
          <label className={styles.campoPesquisa}>
            <span>Pesquisar</span>
            <input
              type="search"
              placeholder="Código, cliente ou produto"
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(1);
              }}
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={filtroStatus}
              onChange={(event) => {
                setFiltroStatus(event.target.value);
                setPagina(1);
              }}
            >
              <option value="todos">Todos</option>
              <option value="em_producao">Em produção</option>
              <option value="pronto_entrega">Para entrega</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
          <label>
            <span>Período</span>
            <select
              value={filtroPeriodo}
              onChange={(event) => {
                setFiltroPeriodo(event.target.value);
                setPagina(1);
              }}
            >
              <option value="todos">Qualquer data</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
          </label>
          <label>
            <span>Ordenar por</span>
            <select
              value={ordenacao}
              onChange={(event) => {
                setOrdenacao(event.target.value);
                setPagina(1);
              }}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="maior_valor">Maior valor</option>
              <option value="menor_valor">Menor valor</option>
            </select>
          </label>
        </div>

        <div className={styles.containerTabela}>
          <table className={styles.tabelaPedidos}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Produto</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody key={pagina}>
              {pedidosDaPagina.map((pedido) => (
                <tr key={pedido.codigo}>
                  <td className={styles.codigoPedido}>#{pedido.codigo}</td>
                  <td>
                    <div className={styles.produtoNaTabela}>
                      <IlustracaoProduto pequena />
                      <span>{pedido.itens[0].nome}</span>
                    </div>
                  </td>
                  <td>{pedido.cliente}</td>
                  <td>{formatarData(pedido.data)}</td>
                  <td>{formatarMoeda(pedido.total)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[classeStatus[pedido.status]]}`}
                    >
                      {rotuloStatus[pedido.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.botaoDetalhes}
                      onClick={() => setPedidoSelecionado(pedido)}
                    >
                      Ver pedido
                    </button>
                  </td>
                </tr>
              ))}
              {pedidosDaPagina.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.semResultados}>
                    {pedidos.length === 0
                      ? 'Sua loja ainda não recebeu pedidos.'
                      : 'Nenhum pedido encontrado com esses filtros.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.paginacao}>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <div>
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
              disabled={pagina === 1}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
              disabled={pagina === totalPaginas || pedidosFiltrados.length === 0}
            >
              Próxima
            </button>
          </div>
        </div>
      </section>

      {pedidoSelecionado && (
        <div
          className={styles.fundoModal}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPedidoSelecionado(null);
          }}
        >
          <section
            className={styles.modalPedido}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-pedido"
          >
            <header className={styles.cabecalhoModal}>
              <div>
                <p className={styles.sobretitulo}>Detalhes do pedido</p>
                <h2 id="titulo-modal-pedido">#{pedidoSelecionado.codigo}</h2>
              </div>
              <button
                type="button"
                className={styles.fecharModal}
                aria-label="Fechar detalhes do pedido"
                onClick={() => setPedidoSelecionado(null)}
              >
                ×
              </button>
            </header>

            <div className={styles.conteudoModal}>
              <section className={styles.blocoDetalhe}>
                <h3>Informações gerais</h3>
                <div className={styles.gradeDetalhes}>
                  <span>Data<strong>{formatarData(pedidoSelecionado.data)}</strong></span>
                  <span>Status<strong>{rotuloStatus[pedidoSelecionado.status]}</strong></span>
                  <span>Valor total<strong>{formatarMoeda(pedidoSelecionado.total)}</strong></span>
                </div>
              </section>

              <section className={styles.blocoDetalhe}>
                <h3>Cliente</h3>
                <p className={styles.clienteNome}>{pedidoSelecionado.cliente}</p>
                <p>{pedidoSelecionado.email}</p>
                <p>{pedidoSelecionado.telefone}</p>
              </section>

              <section className={styles.blocoDetalhe}>
                <h3>Produtos</h3>
                <div className={styles.listaProdutosDetalhe}>
                  {pedidoSelecionado.itens.map((item) => (
                    <div className={styles.itemDetalhe} key={item.nome}>
                      <IlustracaoProduto pequena />
                      <span>{item.nome}<small>Quantidade: {item.quantidade}</small></span>
                      <strong>{formatarMoeda(item.valor * item.quantidade)}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.blocoDetalhe}>
                <h3>Acompanhamento</h3>
                <ol className={styles.historicoStatus}>
                  {pedidoSelecionado.historico.map((evento) => (
                    <li key={`${evento.descricao}-${evento.data}`}>
                      <span className={styles.pontoHistorico} />
                      <div>
                        <strong>{evento.descricao}</strong>
                        <time>{formatarData(evento.data)}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className={styles.blocoAtualizacoes}>
                <div>
                  <h3>Atualizações para o cliente</h3>
                  <p>Este espaço poderá reunir fotos e mensagens sobre o processo de produção.</p>
                </div>
                <span>Em breve</span>
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PedidosArtesao;
