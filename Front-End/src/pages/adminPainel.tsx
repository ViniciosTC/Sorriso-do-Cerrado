import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './adminPainel.module.css';

type AbaPainel = 'resumo' | 'produtos';

interface Produto {
  id: number;
  nome: string;
  categoria?: string;
  preco: string | number;
}

function AdminPainel() {
  const location = useLocation();
  const abaInicial: AbaPainel =
    (location.state as { aba?: AbaPainel } | null)?.aba || 'resumo';

  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>(abaInicial);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { mostrarNotificacao, confirmarAcao } = useNotificacao();

  const nomeVendedor = user?.name || 'Ateliê Dona Maria';

  const fetchProdutos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/produtos', {
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
                className={styles.itemMenuDesabilitado}
                disabled
              >
                Pedidos
              </button>

              <button
                type="button"
                className={styles.itemMenuDesabilitado}
                disabled
              >
                Mensagens
              </button>

              <button
                type="button"
                className={styles.itemMenuDesabilitado}
                disabled
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
                    <h1 className={styles.tituloPainel}>Painel do vendedor</h1>
                    <p className={styles.nomeVendedor}>{nomeVendedor}</p>
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

                <div className={styles.gradeCardsResumo}>
                  <div className={styles.cardResumo}>
                    <span className={styles.tituloCardResumo}>
                      Vendas no mês
                    </span>
                  </div>

                  <div className={styles.cardResumo}>
                    <span className={styles.tituloCardResumo}>
                      Produtos ativos
                    </span>
                  </div>
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
          </section>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

export default AdminPainel;
