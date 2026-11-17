import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './saldoArtesao.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Saldo {
  repasseAutomatico: boolean;
  disponivel: number;
  bloqueado: number;
  saqueMinimo: number;
}

interface Saque {
  id: string;
  valor: number;
  taxa: number;
  status: 'concluido' | 'falhou';
  criadoEm: string;
}

const ROTULO_STATUS: Record<Saque['status'], string> = {
  concluido: 'Concluído',
  falhou: 'Falhou',
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    valor
  );

const formatarData = (valor: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(valor));

function SaldoArtesao() {
  const { mostrarNotificacao } = useNotificacao();
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [saques, setSaques] = useState<Saque[]>([]);
  const [valor, setValor] = useState('');
  const [sacando, setSacando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      const [resSaldo, resSaques] = await Promise.all([
        axios.get<Saldo>(`${API_URL}/usuarios/artesao/saldo`, {
          withCredentials: true,
        }),
        axios.get<Saque[]>(`${API_URL}/usuarios/artesao/saques`, {
          withCredentials: true,
        }),
      ]);
      setSaldo(resSaldo.data);
      setSaques(resSaques.data);
      setErro('');
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
      setErro('Não foi possível carregar o saldo agora.');
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const valorNumerico = Number(valor.replace(',', '.'));
  const podeSacar =
    saldo !== null &&
    !sacando &&
    Number.isFinite(valorNumerico) &&
    valorNumerico >= saldo.saqueMinimo &&
    valorNumerico <= saldo.disponivel;

  const sacar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSacando(true);

    try {
      const { data } = await axios.post<Pick<Saque, 'status'>>(
        `${API_URL}/usuarios/artesao/saques`,
        { valor: valorNumerico },
        { withCredentials: true }
      );
      setValor('');
      mostrarNotificacao(
        data.status === 'concluido'
          ? 'Saque realizado! O valor chega por PIX em instantes.'
          : 'O saque não foi concluído. O valor continua no seu saldo.',
        data.status === 'concluido' ? 'sucesso' : 'erro'
      );
      await carregar();
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      const mensagem = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      mostrarNotificacao(mensagem || 'Não foi possível sacar agora.', 'erro');
    } finally {
      setSacando(false);
    }
  };

  return (
    <section className={styles.cartao} aria-labelledby="titulo-saldo">
      <h2 id="titulo-saldo">Seu saldo</h2>

      {erro && <p className={styles.erro}>{erro}</p>}

      {saldo && !saldo.repasseAutomatico && (
        <p className={styles.ajuda}>
          O repasse automático ainda não está disponível. O valor que você
          recebe em cada venda aparece em Pedidos e será repassado pela equipe
          do Sorriso do Cerrado.
        </p>
      )}

      {saldo?.repasseAutomatico && (
        <>
          <div className={styles.valores}>
            <div>
              <span>Disponível para saque</span>
              <strong>{formatarMoeda(saldo.disponivel)}</strong>
            </div>
            <div>
              <span>Bloqueado</span>
              <strong>{formatarMoeda(saldo.bloqueado)}</strong>
            </div>
          </div>

          <form className={styles.formulario} onSubmit={sacar}>
            <label>
              <span>Valor do saque (R$)</span>
              <input
                type="number"
                min={saldo.saqueMinimo}
                max={saldo.disponivel}
                step="0.01"
                placeholder={`Mínimo ${formatarMoeda(saldo.saqueMinimo)}`}
                value={valor}
                onChange={(event) => setValor(event.target.value)}
              />
            </label>
            <button type="submit" disabled={!podeSacar}>
              {sacando ? 'Sacando...' : 'Sacar'}
            </button>
          </form>

          <p className={styles.ajuda}>
            O saque é enviado por PIX para a chave do seu CPF/CNPJ cadastrado,
            e uma taxa da AbacatePay é descontada do valor.
          </p>
        </>
      )}

      {saques.length > 0 && (
        <ul className={styles.historico} aria-label="Histórico de saques">
          {saques.map((saque) => (
            <li key={saque.id}>
              <span>{formatarData(saque.criadoEm)}</span>
              <strong>{formatarMoeda(saque.valor)}</strong>
              <span>Taxa {formatarMoeda(saque.taxa)}</span>
              <span
                className={
                  saque.status === 'concluido' ? styles.concluido : styles.falhou
                }
              >
                {ROTULO_STATUS[saque.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SaldoArtesao;
