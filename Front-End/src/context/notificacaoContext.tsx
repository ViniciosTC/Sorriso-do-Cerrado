import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './notificacao.module.css';

type TipoNotificacao = 'sucesso' | 'erro' | 'aviso';

interface Notificacao {
  id: number;
  mensagem: string;
  tipo: TipoNotificacao;
}

interface ConfirmacaoEstado {
  mensagem: string;
  resolver: (confirmado: boolean) => void;
}

interface NotificacaoContextType {
  mostrarNotificacao: (mensagem: string, tipo?: TipoNotificacao) => void;
  confirmarAcao: (mensagem: string) => Promise<boolean>;
}

const NotificacaoContext = createContext<NotificacaoContextType | null>(null);

export function NotificacaoProvider({ children }: { children: React.ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoEstado | null>(null);

  const removerNotificacao = useCallback((id: number) => {
    setNotificacoes((atuais) => atuais.filter((item) => item.id !== id));
  }, []);

  const mostrarNotificacao = useCallback(
    (mensagem: string, tipo: TipoNotificacao = 'sucesso') => {
      const id = Date.now() + Math.random();

      setNotificacoes((atuais) => [...atuais, { id, mensagem, tipo }]);

      setTimeout(() => {
        removerNotificacao(id);
      }, 3800);
    },
    [removerNotificacao]
  );

  const confirmarAcao = useCallback((mensagem: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmacao({
        mensagem,
        resolver: resolve,
      });
    });
  }, []);

  const responderConfirmacao = (resposta: boolean) => {
    if (confirmacao) {
      confirmacao.resolver(resposta);
      setConfirmacao(null);
    }
  };

  return (
    <NotificacaoContext.Provider value={{ mostrarNotificacao, confirmarAcao }}>
      {children}

      {/* Container de Notificações (Toasts) */}
      <div className={styles.containerNotificacoes} aria-live="polite">
        {notificacoes.map((item) => (
          <div
            key={item.id}
            className={`${styles.notificacao} ${styles[item.tipo]}`}
            role="status"
          >
            <span className={styles.textoNotificacao}>{item.mensagem}</span>
            <button
              type="button"
              className={styles.botaoFechar}
              onClick={() => removerNotificacao(item.id)}
              aria-label="Fechar notificação"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Modal de Confirmação */}
      {confirmacao && (
        <div className={styles.fundoModal} role="dialog" aria-modal="true">
          <div className={styles.caixaModal}>
            <p className={styles.textoModal}>{confirmacao.mensagem}</p>
            <div className={styles.botoesModal}>
              <button
                type="button"
                className={styles.botaoCancelar}
                onClick={() => responderConfirmacao(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.botaoConfirmar}
                onClick={() => responderConfirmacao(true)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificacaoContext.Provider>
  );
}

export function useNotificacao() {
  const context = useContext(NotificacaoContext);

  if (!context) {
    throw new Error(
      'useNotificacao deve ser usado dentro de um NotificacaoProvider'
    );
  }

  return context;
}
