import React from 'react';
import styles from './rodape.module.css';

function Rodape({ piadaEscondida = false }: { piadaEscondida?: boolean }) {
  const abrirPiada = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.alert('☠️ SAMANTHA... ☠️\n\nSua dívida continua em aberto.\n\nAs sombras sussurram seu nome...\nOs espíritos aguardam o pagamento...\n\nUm salgado e um suco.\n\nPague enquanto ainda há tempo.\n\nAtenciosamente,\nVinicios — O cobrador do além.');
  };

  return (
    <footer className={styles.rodape}>
      <p>
        &copy; {new Date().getFullYear()} Sorriso do Cerrado. Todos os direitos reservad
        {piadaEscondida ? (
          <a className={styles.linkPiada} href="#" onClick={abrirPiada} aria-label="Mensagem escondida">
            o
          </a>
        ) : (
          'o'
        )}
        s.
      </p>
    </footer>
  );
}

export default Rodape;