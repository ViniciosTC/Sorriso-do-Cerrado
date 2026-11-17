import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { authClient } from '../auth/auth-client';
import { useNotificacao } from '../context/notificacaoContext';
import AvatarUsuario from '../componentes/avatarUsuario';
import BarraNavegacao from '../componentes/barraNavegacao';
import CardProduto from '../componentes/cards';
import Rodape from '../componentes/rodape';
import styles from './perfil.module.css';

type AbaPerfil = 'visao-geral' | 'editar-dados' | 'alterar-senha';

interface Pedido {
  id: number;
  data: string | null;
  total: string | number | null;
  status: string | null;
}

interface ProdutoFavorito {
  id: number;
  nome: string;
  preco: string | number;
  imagemURL?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TAMANHO_MAXIMO_FOTO = 10 * 1024 * 1024;

function Perfil() {
  const { user, isAuthenticated } = useAuth();
  const { mostrarNotificacao } = useNotificacao();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [abaAtiva, setAbaAtiva] = useState<AbaPerfil>('visao-geral');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mostrarTodosPedidos, setMostrarTodosPedidos] = useState(false);
  const [favoritos, setFavoritos] = useState<ProdutoFavorito[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [carregandoFavoritos, setCarregandoFavoritos] = useState(true);
  const [erroPedidos, setErroPedidos] = useState(false);
  const [erroFavoritos, setErroFavoritos] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [salvandoDados, setSalvandoDados] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const buscarPedidos = async () => {
      try {
        const { data } = await axios.get<Pedido[]>(`${API_URL}/vendas/me`, {
          withCredentials: true,
        });
        setPedidos(data);
      } catch (error) {
        console.error('Erro ao buscar pedidos do usuário:', error);
        setErroPedidos(true);
      } finally {
        setCarregandoPedidos(false);
      }
    };

    const buscarFavoritos = async () => {
      try {
        const { data } = await axios.get<ProdutoFavorito[]>(
          `${API_URL}/favoritos`,
          { withCredentials: true }
        );
        setFavoritos(data.slice(0, 3));
      } catch (error) {
        console.error('Erro ao buscar favoritos do usuário:', error);
        setErroFavoritos(true);
      } finally {
        setCarregandoFavoritos(false);
      }
    };

    void buscarPedidos();
    void buscarFavoritos();
  }, [isAuthenticated]);

  const handleAlterarFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      mostrarNotificacao('Selecione um arquivo de imagem válido.', 'erro');
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      mostrarNotificacao('A imagem deve ter no máximo 10 MB.', 'erro');
      return;
    }

    setSalvandoFoto(true);
    try {
      const formulario = new FormData();
      formulario.append('imagem', arquivo);
      const { data } = await axios.post<{ url: string }>(
        `${API_URL}/upload`,
        formulario,
        { withCredentials: true }
      );

      const { error } = await authClient.updateUser({ image: data.url });
      if (error) {
        mostrarNotificacao(error.message || 'Não foi possível salvar a foto.', 'erro');
        return;
      }

      mostrarNotificacao('Foto de perfil atualizada.', 'sucesso');
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      mostrarNotificacao('Não foi possível atualizar a foto de perfil.', 'erro');
    } finally {
      setSalvandoFoto(false);
    }
  };

  const handleRemoverFoto = async () => {
    setSalvandoFoto(true);
    try {
      const { error } = await authClient.updateUser({ image: null });
      if (error) {
        mostrarNotificacao(error.message || 'Não foi possível remover a foto.', 'erro');
        return;
      }

      mostrarNotificacao('Foto de perfil removida.', 'sucesso');
    } catch (error) {
      console.error('Erro ao remover foto de perfil:', error);
      mostrarNotificacao('Não foi possível remover a foto de perfil.', 'erro');
    } finally {
      setSalvandoFoto(false);
    }
  };

  const handleSalvarDados = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvandoDados(true);

    try {
      if (email !== user?.email) {
        const { error } = await authClient.changeEmail({
          newEmail: email,
          callbackURL: window.location.href,
        });

        if (error) {
          mostrarNotificacao(
            error.message || 'Erro ao atualizar e-mail',
            'erro'
          );
          return;
        }
      }

      const { error } = await authClient.updateUser({
        name: nome,
      });

      if (error) {
        mostrarNotificacao(error.message || 'Erro ao atualizar dados', 'erro');
        return;
      }

      mostrarNotificacao(
        'Dados atualizados com sucesso! Se solicitado, confirme a alteração do e-mail pelo link enviado.',
        'sucesso'
      );
    } finally {
      setSalvandoDados(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      mostrarNotificacao('As senhas não coincidem.', 'erro');
      return;
    }

    setSalvandoSenha(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: senhaAtual,
        newPassword: novaSenha,
        revokeOtherSessions: true,
      });

      if (error) {
        mostrarNotificacao(error.message || 'Erro ao alterar senha', 'erro');
        return;
      }

      mostrarNotificacao('Senha alterada com sucesso!', 'sucesso');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } finally {
      setSalvandoSenha(false);
    }
  };

  const formatarData = (data: string | null) => {
    if (!data) return 'Data não informada';
    const dataFormatada = new Date(data);
    return Number.isNaN(dataFormatada.getTime())
      ? 'Data não informada'
      : dataFormatada.toLocaleDateString('pt-BR');
  };

  return (
    <div className={styles.paginaPerfil}>
      <BarraNavegacao />

      <main className={styles.conteudo}>
        <div className={styles.layoutPerfil}>
          {/* Barra Lateral */}
          <aside className={styles.barraLateral}>
            <nav className={styles.menuLateral} aria-label="Menu do perfil">
              <button
                type="button"
                className={
                  abaAtiva === 'visao-geral'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('visao-geral')}
              >
                Visão geral
              </button>

              <Link
                to="/mensagens"
                className={styles.itemMenu}
              >
                Mensagens
              </Link>

              <button
                type="button"
                className={
                  abaAtiva === 'editar-dados'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('editar-dados')}
              >
                Editar dados
              </button>

              <button
                type="button"
                className={
                  abaAtiva === 'alterar-senha'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('alterar-senha')}
              >
                Alterar senha
              </button>
            </nav>
          </aside>

          {/* Área Principal */}
          <div className={styles.areaPrincipal}>
            <header className={styles.cabecalho}>
              <p className={styles.eyebrow}>Minha conta</p>
              <h1>Perfil</h1>
              <p>Consulte suas informações e acompanhe sua atividade.</p>
            </header>

            {abaAtiva === 'visao-geral' && (
              <>
                <section className={`${styles.card} ${styles.cardPerfil}`}>
                  <div className={styles.fotoPerfil}>
                    <AvatarUsuario
                      image={user?.image}
                      className={styles.avatarGrande}
                    />
                  </div>
                  <div className={styles.informacoesConta}>
                    <h2>{user?.name || 'Nome não informado'}</h2>
                    <p>{user?.email}</p>
                  </div>
                </section>

                <div className={styles.gradeSecoes}>
                  <section className={`${styles.card} ${styles.secao}`}>
                    <div className={styles.tituloSecao}>
                      <div>
                        <h2>Últimos pedidos</h2>
                        <p>Seus pedidos mais recentes</p>
                      </div>
                      <span className={styles.iconeSecao} aria-hidden="true">⌑</span>
                    </div>
                    {carregandoPedidos ? (
                      <p className={styles.estado}>Carregando pedidos...</p>
                    ) : erroPedidos ? (
                      <p className={styles.estado}>Não foi possível carregar seus pedidos.</p>
                    ) : pedidos.length ? (
                      <>
                        <div className={styles.listaPedidos}>
                          {(mostrarTodosPedidos ? pedidos : pedidos.slice(0, 3)).map(
                            (pedido) => (
                              <article className={styles.pedido} key={pedido.id}>
                                <div>
                                  <strong>Pedido #{pedido.id}</strong>
                                  <span>{formatarData(pedido.data)}</span>
                                </div>
                                <div className={styles.detalhePedido}>
                                  {pedido.total != null && (
                                    <strong>
                                      R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                                    </strong>
                                  )}
                                  {pedido.status && <span>{pedido.status}</span>}
                                </div>
                              </article>
                            )
                          )}
                        </div>
                        <button
                          type="button"
                          className={styles.botaoLinkSecao}
                          onClick={() =>
                            setMostrarTodosPedidos((atual) => !atual)
                          }
                        >
                          {mostrarTodosPedidos
                            ? 'Mostrar menos pedidos'
                            : `Ver todos os pedidos (${pedidos.length})`}
                        </button>
                      </>
                    ) : (
                      <p className={styles.estado}>Você ainda não possui pedidos.</p>
                    )}
                  </section>

                  <section className={`${styles.card} ${styles.secao}`}>
                    <div className={styles.tituloSecao}>
                      <div>
                        <h2>Favoritos</h2>
                        <p>Produtos que você salvou</p>
                      </div>
                      <span className={styles.iconeSecao} aria-hidden="true">♡</span>
                    </div>
                    {carregandoFavoritos ? (
                      <p className={styles.estado}>Carregando favoritos...</p>
                    ) : erroFavoritos ? (
                      <p className={styles.estado}>Não foi possível carregar seus favoritos.</p>
                    ) : favoritos.length ? (
                      <>
                        <div className={styles.gradeFavoritos}>
                          {favoritos.map((produto) => (
                            <CardProduto
                              key={produto.id}
                              product={produto}
                              favoritadoInicial
                              onToggleFavorite={() =>
                                setFavoritos((atuais) =>
                                  atuais.filter((item) => item.id !== produto.id)
                                )
                              }
                            />
                          ))}
                        </div>
                        <Link to="/favoritos" className={styles.linkSecao}>
                          Ver todos os favoritos
                        </Link>
                      </>
                    ) : (
                      <p className={styles.estado}>Você ainda não possui produtos favoritos.</p>
                    )}
                  </section>

                  <section className={`${styles.card} ${styles.secao}`}>
                    <div className={styles.tituloSecao}>
                      <div>
                        <h2>Localização</h2>
                        <p>Endereço de entrega</p>
                      </div>
                      <span className={styles.iconeSecao} aria-hidden="true">⌖</span>
                    </div>
                    <p className={styles.estado}>Nenhuma localização cadastrada.</p>
                    <button type="button" className={styles.botaoIndisponivel} disabled>
                      Adicionar localização
                    </button>
                    <p className={styles.avisoIndisponivel}>
                      O cadastro de endereço ainda não está disponível.
                    </p>
                  </section>

                  <section className={`${styles.card} ${styles.secao}`}>
                    <div className={styles.tituloSecao}>
                      <div>
                        <h2>Telefone</h2>
                        <p>Contato da sua conta</p>
                      </div>
                      <span className={styles.iconeSecao} aria-hidden="true">☎</span>
                    </div>
                    <p className={styles.estado}>Nenhum telefone cadastrado.</p>
                    <button type="button" className={styles.botaoIndisponivel} disabled>
                      Adicionar telefone
                    </button>
                    <p className={styles.avisoIndisponivel}>
                      O cadastro de telefone ainda não está disponível.
                    </p>
                  </section>
                </div>
              </>
            )}

            {abaAtiva === 'editar-dados' && (
              <section className={`${styles.card} ${styles.secaoFormulario}`}>
                <div className={styles.tituloSecao}>
                  <div>
                    <h2>Editar dados</h2>
                    <p>Atualize sua foto e suas informações pessoais</p>
                  </div>
                </div>

                <div className={styles.blocoFotoEditar}>
                  <div className={styles.fotoPerfil}>
                    <AvatarUsuario
                      image={user?.image}
                      className={styles.avatarGrande}
                    />
                    <div className={styles.acoesFoto}>
                      <button
                        type="button"
                        className={styles.botaoPrincipal}
                        onClick={() => inputFotoRef.current?.click()}
                        disabled={salvandoFoto}
                      >
                        {salvandoFoto ? 'Salvando...' : 'Alterar foto'}
                      </button>
                      {user?.image && (
                        <button
                          type="button"
                          className={styles.botaoSecundario}
                          onClick={handleRemoverFoto}
                          disabled={salvandoFoto}
                        >
                          Remover foto
                        </button>
                      )}
                      <input
                        ref={inputFotoRef}
                        className={styles.inputArquivo}
                        type="file"
                        accept="image/*"
                        onChange={handleAlterarFoto}
                        aria-label="Selecionar foto de perfil"
                      />
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSalvarDados} className={styles.formularioPerfil}>
                  <label className={styles.campoPerfil}>
                    <span>Nome</span>
                    <input
                      className={styles.inputPerfil}
                      type="text"
                      placeholder="Novo nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </label>

                  <label className={styles.campoPerfil}>
                    <span>E-mail</span>
                    <input
                      className={styles.inputPerfil}
                      type="email"
                      placeholder="Novo e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className={styles.botaoPrincipal}
                    disabled={salvandoDados}
                  >
                    {salvandoDados ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </form>
              </section>
            )}

            {abaAtiva === 'alterar-senha' && (
              <section className={`${styles.card} ${styles.secaoFormulario}`}>
                <div className={styles.tituloSecao}>
                  <div>
                    <h2>Alterar senha</h2>
                    <p>Atualize sua senha de acesso</p>
                  </div>
                </div>

                <form onSubmit={handleAlterarSenha} className={styles.formularioPerfil}>
                  <label className={styles.campoPerfil}>
                    <span>Senha atual</span>
                    <input
                      className={styles.inputPerfil}
                      type="password"
                      placeholder="Digite sua senha atual"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      required
                    />
                  </label>

                  <label className={styles.campoPerfil}>
                    <span>Nova senha</span>
                    <input
                      className={styles.inputPerfil}
                      type="password"
                      placeholder="Digite a nova senha"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      required
                    />
                  </label>

                  <label className={styles.campoPerfil}>
                    <span>Confirmar nova senha</span>
                    <input
                      className={styles.inputPerfil}
                      type="password"
                      placeholder="Confirme a nova senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className={styles.botaoPrincipal}
                    disabled={salvandoSenha}
                  >
                    {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

export default Perfil;
