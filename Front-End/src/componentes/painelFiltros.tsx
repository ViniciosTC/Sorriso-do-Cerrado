import React from 'react';
import type { Filtros } from '../hooks/useBusca';
import styles from './painelFiltros.module.css';

interface OpcaoOrdem<O extends string> {
  valor: O;
  rotulo: string;
}

interface PainelFiltrosProps<O extends string> {
  filtros: Filtros<O>;
  opcoesOrdem: OpcaoOrdem<O>[];
  rotuloPreco?: string;
  onChange: <K extends keyof Filtros<O>>(chave: K, valor: Filtros<O>[K]) => void;
  onLimpar: () => void;
  temFiltrosAtivos: boolean;
}

function PainelFiltros<O extends string>({
  filtros,
  opcoesOrdem,
  rotuloPreco = 'Preço (R$)',
  onChange,
  onLimpar,
  temFiltrosAtivos,
}: PainelFiltrosProps<O>) {
  return (
    <div className={styles.painel}>
      <label className={styles.grupo}>
        <span className={styles.rotulo}>Ordenar por</span>
        <select
          value={filtros.ordem}
          onChange={(event) => onChange('ordem', event.target.value as O)}
        >
          {opcoesOrdem.map(({ valor, rotulo }) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </label>

      <fieldset className={styles.grupo}>
        <legend className={styles.rotulo}>{rotuloPreco}</legend>
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
