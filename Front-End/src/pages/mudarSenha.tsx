import { useState } from 'react';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { authClient } from '../auth/auth-client';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './mudarSenha.module.css';

function MudarSenha() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const { mostrarNotificacao } = useNotificacao();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    <>
      <BarraNavegacao />

      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.titulo}>Mudar senha</h1>
          <p className={styles.subtitulo}>Atualize sua senha de acesso</p>

          <form onSubmit={handleSubmit} className={styles.form}>
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
      </div>

      <Rodape />
    </>
  );
}

export default MudarSenha;