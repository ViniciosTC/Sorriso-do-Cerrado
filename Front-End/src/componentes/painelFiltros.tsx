import React from 'react';
import type { Filtros, Ordem } from '../hooks/useBuscaProdutos';
import styles from './painelFiltros.module.css';

const OPCOES_ORDEM: { valor: Ordem; rotulo: string }[] = [
  { valor: 'recentes', rotulo: 'Adicionados recentemente' },
  { valor: 'antigos', rotulo: 'Mais antigos' },
  { valor: 'maior_preco', rotulo: 'Maior preço' },
  { valor: 'menor_preco', rotulo: 'Menor preço' },
];

interface PainelFiltrosProps {
  filtros: Filtros;
  onChange: <K extends keyof Filtros>(chave: K, valor: Filtros[K]) => void;
  onLimpar: () => void;
  temFiltrosAtivos: boolean;
}

function PainelFiltros({
  filtros,
  onChange,
  onLimpar,
  temFiltrosAtivos,
}: PainelFiltrosProps) {
  return (
    <div className={styles.painel}>
      <label className={styles.grupo}>
        <span className={styles.rotulo}>Ordenar por</span>
        <select
          value={filtros.ordem}
          onChange={(event) => onChange('ordem', event.target.value as Ordem)}
        >
          {OPCOES_ORDEM.map(({ valor, rotulo }) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </label>

      <fieldset className={styles.grupo}>
        <legend className={styles.rotulo}>Preço (R$)</legend>
        <div className={styles.faixa}>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="De"
            aria-label="Preço mínimo"
            value={filtros.precoMin}
            onChange={(event) => onChange('precoMin', event.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Até"
            aria-label="Preço máximo"
            value={filtros.precoMax}
            onChange={(event) => onChange('precoMax', event.target.value)}
          />
        </div>
      </fieldset>

      <button
        type="button"
        className={styles.botaoLimpar}
        onClick={onLimpar}
        disabled={!temFiltrosAtivos}
      >
        Limpar filtros
      </button>
    </div>
  );
}

export default PainelFiltros;
