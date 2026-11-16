import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/authContext';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './painelAdministrativo.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Indicadores {
  usuarios: number;
  lojas: number;
}

interface Administrador {
  id: string;
  nome: string;
  email: string;
  papel: 'admin' | 'super_admin';
  ativo: boolean;
  criadoEm: string;
}

interface Conta {
  id: string;
  nome: string;
  email: string;
  papel: string | null;
}

interface ErroApi {
  error?: string;
}

type TipoModal = 'criar-admin' | 'editar-admin' | 'editar-conta';

function mensagemErro(error: unknown, padrao: string) {
  if (axios.isAxiosError<ErroApi>(error)) {
    return error.response?.data?.error || error.message || padrao;
  }
  return padrao;
}

function PainelAdministrativo() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { mostrarNotificacao, confirmarAcao } = useNotificacao();

  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoModal, setTipoModal] = useState<TipoModal>('criar-admin');
  const [administradorSelecionado, setAdministradorSelecionado] =
    useState<Administrador | null>(null);
  const [contaSelecionada, setContaSelecionada] = useState<Conta | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento('');

    try {
      const [resumo, listaAdministradores, listaContas] = await Promise.all([
        axios.get<Indicadores>(`${API_URL}/usuarios/indicadores`, {
          withCredentials: true,
        }),
        axios.get<Administrador[]>(`${API_URL}/usuarios/administradores`, {
          withCredentials: true,
        }),
        axios.get<Conta[]>(`${API_URL}/usuarios/clientes-vendedores`, {
          withCredentials: true,
        }),
      ]);

      setIndicadores(resumo.data);
      setAdministradores(listaAdministradores.data);
      setContas(listaContas.data);
    } catch (error: unknown) {
      console.error('Erro ao carregar o Painel Administrativo:', error);
      setErroCarregamento(
        mensagemErro(error, 'Não foi possível carregar os dados administrativos.')
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setAdministradorSelecionado(null);
    setContaSelecionada(null);
    setNome('');
    setEmail('');
    setSenha('');
  };

  const abrirModalCriacao = () => {
    setTipoModal('criar-admin');
    setAdministradorSelecionado(null);
    setContaSelecionada(null);
    setNome('');
    setEmail('');
    setSenha('');
    setModalAberto(true);
  };

  const abrirModalEdicao = (administrador: Administrador) => {
    setTipoModal('editar-admin');
    setAdministradorSelecionado(administrador);
    setContaSelecionada(null);
    setNome('');
    setEmail(administrador.email);
    setSenha('');
    setModalAberto(true);
  };

  const abrirModalEdicaoConta = (conta: Conta) => {
    setTipoModal('editar-conta');
    setAdministradorSelecionado(null);
    setContaSelecionada(conta);
    setNome(conta.nome);
    setEmail(conta.email);
    setSenha('');
    setModalAberto(true);
  };

  const salvarAdministrador = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSalvando(true);

    try {
      if (tipoModal === 'criar-admin') {
        await axios.post(
          `${API_URL}/usuarios/administradores`,
          { nome: nome.trim(), email: email.trim().toLowerCase(), senha },
          { withCredentials: true }
        );
        mostrarNotificacao('Administrador cadastrado com sucesso.', 'sucesso');
      } else if (tipoModal === 'editar-conta' && contaSelecionada) {
        await axios.put(
          `${API_URL}/usuarios/${contaSelecionada.id}`,
          { nome: nome.trim(), email: email.trim().toLowerCase() },
          { withCredentials: true }
        );
        mostrarNotificacao('Usuário atualizado com sucesso.', 'sucesso');
      } else if (administradorSelecionado) {
        const dados: { email: string; senha?: string } = {
          email: email.trim().toLowerCase(),
        };
        if (senha) dados.senha = senha;

        await axios.patch(
          `${API_URL}/usuarios/administradores/${administradorSelecionado.id}`,
          dados,
          { withCredentials: true }
        );
        mostrarNotificacao('Administrador atualizado com sucesso.', 'sucesso');
      }

      setModalAberto(false);
      setAdministradorSelecionado(null);
      setContaSelecionada(null);
      setNome('');
      setEmail('');
      setSenha('');
      await carregarDados();
    } catch (error: unknown) {
      console.error('Erro ao salvar administrador:', error);
      mostrarNotificacao(
        mensagemErro(error, 'Não foi possível salvar o administrador.'),
        'erro'
      );
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatusAdministrador = async (administrador: Administrador) => {
    const ativo = !administrador.ativo;
    const confirmado = await confirmarAcao(
      ativo
        ? `Deseja reativar a conta de ${administrador.nome}?`
        : `Deseja desativar a conta de ${administrador.nome}? O acesso será encerrado.`
    );
    if (!confirmado) return;

    setAcaoEmAndamento(administrador.id);
    try {
      await axios.patch(
        `${API_URL}/usuarios/administradores/${administrador.id}/estado`,
        { ativo },
        { withCredentials: true }
      );
      mostrarNotificacao(
        ativo
          ? 'Administrador reativado com sucesso.'
          : 'Administrador desativado com sucesso.',
        'sucesso'
      );
      await carregarDados();
    } catch (error: unknown) {
      console.error('Erro ao alterar o status do administrador:', error);
      mostrarNotificacao(
        mensagemErro(error, 'Não foi possível alterar o status do administrador.'),
        'erro'
      );
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  const excluirAdministrador = async (administrador: Administrador) => {
    const confirmado = await confirmarAcao(
      `Confirma a exclusão lógica da conta de ${administrador.nome}? Ela não poderá mais acessar o sistema, e os dados históricos serão preservados.`
    );
    if (!confirmado) return;

    setAcaoEmAndamento(administrador.id);
    try {
      await axios.delete(
        `${API_URL}/usuarios/administradores/${administrador.id}`,
        { withCredentials: true }
      );
      mostrarNotificacao('Administrador excluído com sucesso.', 'sucesso');
      await carregarDados();
    } catch (error: unknown) {
      console.error('Erro ao excluir o administrador:', error);
      mostrarNotificacao(
        mensagemErro(error, 'Não foi possível excluir o administrador.'),
        'erro'
      );
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  const excluirConta = async (conta: Conta) => {
    const confirmado = await confirmarAcao(
      `Confirma a desativação da conta de ${conta.nome}? Esta ação impede o login, mas preserva os dados históricos.`
    );
    if (!confirmado) return;

    setAcaoEmAndamento(conta.id);
    try {
      await axios.delete(`${API_URL}/usuarios/${conta.id}`, {
        withCredentials: true,
        data: { confirmacao: true },
      });
      mostrarNotificacao('Conta desativada com sucesso.', 'sucesso');
      await carregarDados();
    } catch (error: unknown) {
      console.error('Erro ao desativar a conta:', error);
      mostrarNotificacao(
        mensagemErro(error, 'Não foi possível desativar a conta.'),
        'erro'
      );
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  return (
    <div className={styles.pagina}>
      <BarraNavegacao />
      <main className={styles.conteudo}>
        <h1 className={styles.titulo}>Painel Administrativo</h1>

        {erroCarregamento && (
          <div className={styles.erroCarregamento} role="alert">
            <p>{erroCarregamento}</p>
            <button type="button" onClick={() => void carregarDados()}>
              Tentar novamente
            </button>
          </div>
        )}

        <section className={styles.gradeIndicadores} aria-label="Indicadores">
          <article className={styles.cardIndicador}>
            <h2>Usuários</h2>
            <strong>
              {carregando ? '…' : indicadores?.usuarios ?? '—'}
            </strong>
            <span>Clientes cadastrados</span>
          </article>
          <article className={styles.cardIndicador}>
            <h2>Lojas</h2>
            <strong>{carregando ? '…' : indicadores?.lojas ?? '—'}</strong>
            <span>Artesãos cadastrados</span>
          </article>
        </section>

        <section className={styles.secao} aria-labelledby="administradores-titulo">
          <div className={styles.cabecalhoSecao}>
            <h2 id="administradores-titulo">Gerenciamento de administradores</h2>
            {isSuperAdmin && (
              <button
                type="button"
                className={styles.botaoPrincipal}
                onClick={abrirModalCriacao}
              >
                Cadastrar administrador
              </button>
            )}
          </div>

          <div className={styles.containerTabela}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Acesso</th>
                  <th scope="col">Status</th>
                  {isSuperAdmin && <th scope="col">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 5 : 4} className={styles.mensagemVazia}>
                      Carregando administradores…
                    </td>
                  </tr>
                ) : administradores.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 5 : 4} className={styles.mensagemVazia}>
                      Nenhum administrador encontrado.
                    </td>
                  </tr>
                ) : (
                  administradores.map((administrador) => {
                    const superAdmin = administrador.papel === 'super_admin';
                    const podeGerenciar = isSuperAdmin && !superAdmin;

                    return (
                      <tr key={administrador.id}>
                        <td>{administrador.nome}</td>
                        <td>{administrador.email}</td>
                        <td>
                          <span
                            className={
                              superAdmin ? styles.badgeSuperAdmin : styles.badge
                            }
                          >
                            {superAdmin ? 'Super Admin' : 'Administrador'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              administrador.ativo
                                ? styles.statusAtivo
                                : styles.statusInativo
                            }
                          >
                            {administrador.ativo ? 'Ativo' : 'Desativado'}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td>
                            {podeGerenciar ? (
                              <div className={styles.acoes}>
                                <button
                                  type="button"
                                  className={styles.botaoSecundario}
                                  disabled={acaoEmAndamento === administrador.id}
                                  onClick={() => abrirModalEdicao(administrador)}
                                >
                                  Editar
                                </button>
                                {administrador.ativo ? (
                                  <button
                                    type="button"
                                    className={styles.botaoPerigo}
                                    disabled={acaoEmAndamento === administrador.id}
                                    onClick={() =>
                                      void alterarStatusAdministrador(administrador)
                                    }
                                  >
                                    Desativar
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className={styles.botaoSecundario}
                                    disabled={acaoEmAndamento === administrador.id}
                                    onClick={() =>
                                      void alterarStatusAdministrador(administrador)
                                    }
                                  >
                                    Reativar
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={styles.botaoPerigo}
                                  disabled={acaoEmAndamento === administrador.id}
                                  onClick={() =>
                                    void excluirAdministrador(administrador)
                                  }
                                >
                                  Excluir
                                </button>
                              </div>
                            ) : (
                              <span className={styles.semAcao}>Protegido</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.secao} aria-labelledby="contas-titulo">
          <div className={styles.cabecalhoSecao}>
            <h2 id="contas-titulo">Gerenciamento de clientes e vendedores</h2>
          </div>

          <div className={styles.containerTabela}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Tipo de conta</th>
                  {isAdmin && <th scope="col">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className={styles.mensagemVazia}>
                      Carregando contas…
                    </td>
                  </tr>
                ) : contas.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className={styles.mensagemVazia}>
                      Nenhuma conta encontrada.
                    </td>
                  </tr>
                ) : (
                  contas.map((conta) => (
                    <tr key={conta.id}>
                      <td>{conta.nome}</td>
                      <td>{conta.email}</td>
                      <td>
                        <span className={styles.badge}>
                          {conta.papel === 'cliente' || conta.papel === null
                            ? 'Cliente'
                            : 'Artesão / vendedor'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className={styles.acoes}>
                            <button
                              type="button"
                              className={styles.botaoSecundario}
                              disabled={acaoEmAndamento === conta.id}
                              onClick={() => abrirModalEdicaoConta(conta)}
                            >
                              Editar
                            </button>
                            {isSuperAdmin && (
                              <button
                                type="button"
                                className={styles.botaoPerigo}
                                disabled={acaoEmAndamento === conta.id}
                                onClick={() => void excluirConta(conta)}
                              >
                                Excluir conta
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Rodape />

      {modalAberto && (
        <div className={styles.fundoModal}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-administrador"
          >
            <div className={styles.cabecalhoModal}>
              <h2 id="titulo-modal-administrador">
                {tipoModal === 'criar-admin'
                  ? 'Cadastrar administrador'
                  : tipoModal === 'editar-admin'
                    ? 'Editar administrador'
                    : 'Editar usuário'}
              </h2>
              <button
                type="button"
                className={styles.fecharModal}
                aria-label="Fechar"
                disabled={salvando}
                onClick={fecharModal}
              >
                ×
              </button>
            </div>
            <form className={styles.formulario} onSubmit={salvarAdministrador}>
              {tipoModal !== 'editar-admin' && (
                <label className={styles.campo}>
                  <span>Nome</span>
                  <input
                    type="text"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    autoComplete="name"
                    maxLength={255}
                    required
                  />
                </label>
              )}
              <label className={styles.campo}>
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  maxLength={255}
                  required
                />
              </label>
              {tipoModal !== 'editar-conta' && (
                <>
                  <label className={styles.campo}>
                    <span>
                      Senha{tipoModal === 'editar-admin' ? ' (opcional)' : ''}
                    </span>
                    <input
                      type="password"
                      value={senha}
                      onChange={(event) => setSenha(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required={tipoModal === 'criar-admin'}
                    />
                  </label>
                  {tipoModal === 'editar-admin' && (
                    <p className={styles.ajudaSenha}>
                      Deixe a senha em branco para manter a atual.
                    </p>
                  )}
                </>
              )}
              <div className={styles.acoesModal}>
                <button
                  type="button"
                  className={styles.botaoSecundario}
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.botaoPrincipal}
                  disabled={salvando}
                >
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default PainelAdministrativo;
