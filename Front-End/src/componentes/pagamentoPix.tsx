import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './pagamentoPix.module.css';

export interface DadosPix {
  brCode: string;
  brCodeBase64: string;
  devMode?: boolean;
}

interface PagamentoPixProps {
  vendaId: number;
  pix: DadosPix;
  onPago: () => void;
  onExpirado: () => void;
}

const INTERVALO_CONSULTA_MS = 5000;

function PagamentoPix({ vendaId, pix, onPago, onExpirado }: PagamentoPixProps) {
  const [copiado, setCopiado] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [erroSimulacao, setErroSimulacao] = useState('');

  useEffect(() => {
    const consultarPagamento = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:3000/vendas/${vendaId}/pagamento`,
          { withCredentials: true }
        );

        if (data.status === 'confirmada') onPago();
        if (data.status === 'cancelada') onExpirado();
      } catch (error) {
        console.error('Erro ao consultar pagamento:', error);
      }
    };

    const intervalo = setInterval(consultarPagamento, INTERVALO_CONSULTA_MS);
    return () => clearInterval(intervalo);
  }, [vendaId, onPago, onExpirado]);

  const copiarCodigo = async () => {
    await navigator.clipboard.writeText(pix.brCode);
    setCopiado(true);
  };

  const simularPagamento = async () => {
    setSimulando(true);
    setErroSimulacao('');
    try {
      await axios.post(
        `http://localhost:3000/vendas/${vendaId}/simular-pagamento`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Erro ao simular pagamento de teste:', error);
      setErroSimulacao(
        'Não foi possível simular o pagamento. Confira a configuração do Modo de Teste.'
      );
    } finally {
      setSimulando(false);
    }
  };

  return (
    <div className={styles.pagamentoPix}>
      <h3>Pague com PIX para concluir o pedido</h3>

      <img
        src={pix.brCodeBase64}
        alt="QR Code do PIX"
        className={styles.qrCode}
      />

      <p>Escaneie o QR Code ou use o PIX copia e cola:</p>
      <code className={styles.codigoPix}>{pix.brCode}</code>

      <button onClick={copiarCodigo} className={styles.botaoCopiar}>
        {copiado ? 'Código copiado!' : 'Copiar código PIX'}
      </button>

      {pix.devMode && (
        <button
          type="button"
          onClick={simularPagamento}
          disabled={simulando}
          className={styles.botaoCopiar}
        >
          {simulando ? 'Simulando...' : 'Simular pagamento (Dev Mode)'}
        </button>
      )}
      {erroSimulacao && <p role="alert">{erroSimulacao}</p>}

      <p className={styles.aguardando}>Aguardando pagamento...</p>
    </div>
  );
}

export default PagamentoPix;
