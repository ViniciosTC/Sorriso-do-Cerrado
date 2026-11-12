import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './pagamentoPix.module.css';

export interface DadosPix {
  brCode: string;
  brCodeBase64: string;
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

      <p className={styles.aguardando}>Aguardando pagamento...</p>
    </div>
  );
}

export default PagamentoPix;
