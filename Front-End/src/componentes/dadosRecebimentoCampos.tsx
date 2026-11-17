import styles from './dadosRecebimentoCampos.module.css';
import { useNotificacao } from '../context/notificacaoContext';

export type TipoChavePix =
  | 'cpf'
  | 'cnpj'
  | 'email'
  | 'telefone'
  | 'aleatoria';

export interface DadosRecebimento {
  pix?: {
    tipoChavePix: TipoChavePix;
    chavePix: string;
  };
  transferencia?: {
    banco: string;
    agencia: string;
    numeroConta: string;
    digitoConta?: string;
    tipoConta: 'corrente' | 'poupanca';
  };
}

export const dadosRecebimentoInicial: DadosRecebimento = {
  pix: {
    tipoChavePix: 'email',
    chavePix: '',
  },
};

const validarDocumentoChave = (valor: string, tipo: 'cpf' | 'cnpj') => {
  const documento = valor.replace(/\D/g, '');
  if (tipo === 'cpf' && documento.length === 11) {
    if (/^(\d)\1{10}$/.test(documento)) return false;
    const calcularDigito = (base: number[], peso: number) => {
      const soma = base.reduce(
        (total, numero, indice) => total + numero * (peso - indice),
        0
      );
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };
    const base = documento.slice(0, 9).split('').map(Number);
    const primeiro = calcularDigito(base, 10);
    const segundo = calcularDigito([...base, primeiro], 11);
    return documento.endsWith(`${primeiro}${segundo}`);
  }

  if (tipo === 'cnpj' && documento.length === 14) {
    if (/^(\d)\1{13}$/.test(documento)) return false;
    const calcularDigito = (base: string, pesos: number[]) => {
      const soma = base
        .split('')
        .reduce(
          (total, digito, indice) => total + Number(digito) * pesos[indice],
          0
        );
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    const base = documento.slice(0, 12);
    const primeiro = calcularDigito(base, [
      5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
    ]);
    const segundo = calcularDigito(`${base}${primeiro}`, [
      6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
    ]);
    return documento.endsWith(`${primeiro}${segundo}`);
  }

  return false;
};

export const validarDadosRecebimento = (
  dados: DadosRecebimento
): string | null => {
  if (!dados.pix && !dados.transferencia) {
    return 'Selecione Pix, transferência bancária ou ambos.';
  }

  if (dados.pix) {
    const { tipoChavePix, chavePix } = dados.pix;
    const chave = chavePix.trim();
    if (!chave) return 'Preencha a chave Pix.';
    if (chave.length > 100) {
      return 'A chave Pix deve ter no máximo 100 caracteres.';
    }

    const chaveValida =
      (tipoChavePix === 'cpf' &&
        validarDocumentoChave(chave, 'cpf')) ||
      (tipoChavePix === 'cnpj' &&
        validarDocumentoChave(chave, 'cnpj')) ||
      (tipoChavePix === 'email' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave)) ||
      (tipoChavePix === 'telefone' &&
        chave.replace(/\D/g, '').length >= 10 &&
        chave.replace(/\D/g, '').length <= 13) ||
      (tipoChavePix === 'aleatoria' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          chave
        ));
    if (!chaveValida) {
      return `A chave Pix informada não corresponde ao formato de ${rotuloTipoChave[tipoChavePix]}.`;
    }
  }

  if (dados.transferencia) {
    const { banco, agencia, numeroConta, digitoConta, tipoConta } =
      dados.transferencia;
    if (!banco.trim()) return 'Preencha o banco.';
    if (banco.trim().length > 100) {
      return 'O nome ou código do banco deve ter no máximo 100 caracteres.';
    }
    if (!agencia.trim()) return 'Preencha a agência.';
    if (agencia.trim().length > 20) {
      return 'A agência deve ter no máximo 20 caracteres.';
    }
    if (!numeroConta.trim()) return 'Preencha o número da conta.';
    if (numeroConta.trim().length > 30) {
      return 'O número da conta deve ter no máximo 30 caracteres.';
    }
    if (digitoConta && digitoConta.trim().length > 5) {
      return 'O dígito da conta deve ter no máximo 5 caracteres.';
    }
    if (!['corrente', 'poupanca'].includes(tipoConta)) {
      return 'Selecione conta corrente ou poupança.';
    }
  }

  return null;
};

interface Props {
  value: DadosRecebimento;
  onChange: (dados: DadosRecebimento) => void;
  disabled?: boolean;
}

const rotuloTipoChave: Record<TipoChavePix, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Chave aleatória',
};

function DadosRecebimentoCampos({ value, onChange, disabled = false }: Props) {
  const pix = value.pix;
  const transferencia = value.transferencia;
  const { mostrarNotificacao } = useNotificacao();

  const definirPix = (ativado: boolean) => {
    if (ativado) {
      onChange({
        ...value,
        pix: value.pix ?? { tipoChavePix: 'email', chavePix: '' },
      });
      return;
    }

    if (!value.transferencia) {
      mostrarNotificacao(
        'Selecione pelo menos uma forma de recebimento.',
        'erro'
      );
      return;
    }

    const { pix: _pix, ...outros } = value;
    onChange(outros);
  };

  const definirTransferencia = (ativado: boolean) => {
    if (ativado) {
      onChange({
        ...value,
        transferencia:
          value.transferencia ?? {
            banco: '',
            agencia: '',
            numeroConta: '',
            tipoConta: 'corrente',
          },
      });
      return;
    }

    if (!value.pix) {
      mostrarNotificacao(
        'Selecione pelo menos uma forma de recebimento.',
        'erro'
      );
      return;
    }

    const { transferencia: _transferencia, ...outros } = value;
    onChange(outros);
  };

  return (
    <fieldset
      disabled={disabled}
      style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}
    >
      <fieldset className={styles.grupoCampos}>
        <legend>Formas de recebimento (escolha uma ou ambas) *</legend>
        <label className={styles.opcao}>
          <input
            type="checkbox"
            checked={Boolean(pix)}
            onChange={(event) => definirPix(event.target.checked)}
          />
          Pix
        </label>
        <label className={styles.opcao}>
          <input
            type="checkbox"
            checked={Boolean(transferencia)}
            onChange={(event) => definirTransferencia(event.target.checked)}
          />
          Transferência bancária
        </label>
      </fieldset>

      {pix && (
        <>
          <label className={styles.campo}>
            <span>Tipo de chave Pix *</span>
            <select
              value={pix.tipoChavePix}
              onChange={(event) =>
                onChange({
                  ...value,
                  pix: {
                    ...pix,
                    tipoChavePix: event.target.value as TipoChavePix,
                  },
                })
              }
              required
            >
              {Object.entries(rotuloTipoChave).map(([tipo, rotulo]) => (
                <option key={tipo} value={tipo}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.campo}>
            <span>Chave Pix *</span>
            <input
              value={pix.chavePix}
              onChange={(event) =>
                onChange({
                  ...value,
                  pix: { ...pix, chavePix: event.target.value },
                })
              }
              type={pix.tipoChavePix === 'email' ? 'email' : 'text'}
              inputMode={
                pix.tipoChavePix === 'cpf' ||
                pix.tipoChavePix === 'cnpj' ||
                pix.tipoChavePix === 'telefone'
                  ? 'numeric'
                  : 'text'
              }
              autoComplete="off"
              maxLength={100}
              required
            />
          </label>
          <p className={styles.ajuda}>
            A chave será armazenada de forma criptografada e não pedimos senha
            ou dados de acesso ao banco.
          </p>
        </>
      )}
      {transferencia && (
        <>
          <label className={styles.campo}>
            <span>Banco (nome ou código) *</span>
            <input
              value={transferencia.banco}
              onChange={(event) =>
                onChange({
                  ...value,
                  transferencia: {
                    ...transferencia,
                    banco: event.target.value,
                  },
                })
              }
              maxLength={100}
              required
            />
          </label>
          <div className={styles.duasColunas}>
            <label className={styles.campo}>
              <span>Agência *</span>
              <input
                value={transferencia.agencia}
                onChange={(event) =>
                  onChange({
                    ...value,
                    transferencia: {
                      ...transferencia,
                      agencia: event.target.value,
                    },
                  })
                }
                maxLength={20}
                required
              />
            </label>
            <label className={styles.campo}>
              <span>Número da conta *</span>
              <input
                value={transferencia.numeroConta}
                onChange={(event) =>
                  onChange({
                    ...value,
                    transferencia: {
                      ...transferencia,
                      numeroConta: event.target.value,
                    },
                  })
                }
                maxLength={30}
                required
              />
            </label>
          </div>
          <div className={styles.duasColunas}>
            <label className={styles.campo}>
              <span>Dígito da conta (se houver)</span>
              <input
                value={transferencia.digitoConta ?? ''}
                onChange={(event) =>
                  onChange({
                    ...value,
                    transferencia: {
                      ...transferencia,
                      digitoConta: event.target.value,
                    },
                  })
                }
                maxLength={5}
              />
            </label>
            <label className={styles.campo}>
              <span>Tipo de conta *</span>
              <select
                value={transferencia.tipoConta}
                onChange={(event) =>
                  onChange({
                    ...value,
                    transferencia: {
                      ...transferencia,
                      tipoConta: event.target.value as
                        | 'corrente'
                        | 'poupanca',
                    },
                  })
                }
                required
              >
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
              </select>
            </label>
          </div>
          <p className={styles.ajuda}>
            Não informe senha bancária nem dados de acesso ao banco.
          </p>
        </>
      )}
    </fieldset>
  );
}

export default DadosRecebimentoCampos;
