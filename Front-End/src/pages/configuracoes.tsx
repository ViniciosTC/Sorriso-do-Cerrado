import React, { useState, useEffect } from 'react';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { authClient } from '../auth/auth-client';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './configuracoes.module.css';

type AbaConfiguracoes = 'editar-dados' | 'mudar-senha';

function Configuracoes() {
  const [abaAtiva, setAbaAtiva] = useState<AbaConfiguracoes>('editar-dados');

  const { user } = useAuth();
  const { mostrarNotificacao } = useNotificacao();

  // Estados de Editar Dados
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  // Estados de Mudar Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    if (user) {
      setNome(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSalvarDados = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
  };

  const handleAlterarSenha = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      mostrarNotificacao('As senhas não coincidem.', 'erro');
      return;
    }

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
  };

  return (
    <div className={styles.paginaConfiguracoes}>
      <BarraNavegacao />

      <main className={styles.conteudoGeral}>
        <div className={styles.layoutConfiguracoes}>
          {/* Barra Lateral */}
          <aside className={styles.barraLateral}>
            <nav className={styles.menuLateral}>
              <button
                type="button"
                className={
                  abaAtiva === 'editar-dados'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('editar-dados')}
              >
                Editar Dados
              </button>

              <button
                type="button"
                className={
                  abaAtiva === 'mudar-senha'
                    ? styles.itemMenuAtivo
                    : styles.itemMenu
                }
                onClick={() => setAbaAtiva('mudar-senha')}
              >
                Mudar Senha
              </button>
            </nav>
          </aside>

          {/* Área Principal */}
          <section className={styles.areaPrincipal}>
            {abaAtiva === 'editar-dados' && (
              <div className={styles.card}>
                <h1 className={styles.titulo}>Editar Dados</h1>
                <p className={styles.subtitulo}>
                  Atualize suas informações pessoais
                </p>

                <form onSubmit={handleSalvarDados} className={styles.form}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Novo nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />

                  <input
                    className={styles.input}
                    type="email"
                    placeholder="Novo e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <button className={styles.botao} type="submit">
                    Salvar alterações
                  </button>
                </form>
              </div>
            )}

            {abaAtiva === 'mudar-senha' && (
              <div className={styles.card}>
                <h1 className={styles.titulo}>Mudar Senha</h1>
                <p className={styles.subtitulo}>
                  Atualize sua senha de acesso
                </p>

                <form onSubmit={handleAlterarSenha} className={styles.form}>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="Senha atual"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                  />

                  <input
                    className={styles.input}
                    type="password"
                    placeholder="Nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                  />

                  <input
                    className={styles.input}
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                  />

                  <button className={styles.botao} type="submit">
                    Alterar senha
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>

      <Rodape />
    </div>
  );
}

export default Configuracoes;
