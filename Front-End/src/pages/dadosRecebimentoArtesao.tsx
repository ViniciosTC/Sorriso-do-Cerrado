import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import BarraNavegacao from '../componentes/barraNavegacao';
import DadosRecebimentoCampos, {
  dadosRecebimentoInicial,
  type DadosRecebimento,
  validarDadosRecebimento,
} from '../componentes/dadosRecebimentoCampos';
import Rodape from '../componentes/rodape';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './cadastroArtesao.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function DadosRecebimentoArtesao() {
  const { isAuthenticated, isArtisan, isPending } = useAuth();
  const { mostrarNotificacao } = useNotificacao();
  const [dados, setDados] = useState<DadosRecebimento>(dadosRecebimentoInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isArtisan) return;

    axios
      .get<{ dadosFinanceiros: DadosRecebimento }>(
        `${API_URL}/usuarios/artesao/recebimentos`,
        { withCredentials: true }
      )
      .then(({ data }) => setDados(data.dadosFinanceiros))
      .catch((error: unknown) => {
        console.error('Erro ao carregar dados de recebimento:', error);
        const mensagem = axios.isAxiosError(error)
          ? error.response?.data?.error
          : undefined;
        setErro(mensagem || 'Não foi possível carregar os dados de recebimento.');
      })
      .finally(() => setCarregando(false));
  }, [isArtisan]);

  if (isPending) return <div>A carregar sessão...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isArtisan) return <Navigate to="/" replace />;

  const salvar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const erroValidacao = validarDadosRecebimento(dados);
    if (erroValidacao) {
      setErro(erroValidacao);
      mostrarNotificacao(erroValidacao, 'erro');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      await axios.put(
        `${API_URL}/usuarios/artesao/recebimentos`,
        dados,
        { withCredentials: true }
      );
      mostrarNotificacao('Dados de recebimento atualizados.', 'sucesso');
    } catch (error) {
      console.error('Erro ao atualizar dados de recebimento:', error);
      const mensagem = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      setErro(mensagem || 'Não foi possível salvar os dados. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={styles.paginaCadastro}>
      <BarraNavegacao />
      <main className={styles.conteudo}>
        <header className={styles.cabecalho}>
          <p className={styles.sobretitulo}>Sorriso do Cerrado</p>
          <h1>Dados para recebimento</h1>
          <p>
            Consulte ou atualize os dados que poderão ser usados para pagamentos
            futuros.
          </p>
        </header>

        <section className={styles.cartao}>
          {carregando ? (
            <div className={styles.conteudoEtapa}>Carregando dados...</div>
          ) : (
            <form noValidate onSubmit={salvar}>
              <section className={styles.conteudoEtapa}>
                <DadosRecebimentoCampos value={dados} onChange={setDados} />
                <p className={styles.ajuda}>
                  As informações são armazenadas criptografadas. Não informe
                  senhas bancárias ou dados de acesso.
                </p>
                {erro && (
                  <p className={styles.erroFormulario} role="alert">
                    {erro}
                  </p>
                )}
                <div className={styles.acoes}>
                  <button
                    type="submit"
                    className={styles.botaoAvancar}
                    disabled={salvando}
                  >
                    {salvando ? 'Salvando...' : 'Salvar dados'}
                  </button>
                </div>
              </section>
            </form>
          )}
        </section>
      </main>
      <Rodape />
    </div>
  );
}

export default DadosRecebimentoArtesao;
