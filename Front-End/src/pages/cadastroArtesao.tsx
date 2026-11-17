import React, { useState } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import DadosRecebimentoCampos, {
  dadosRecebimentoInicial,
  type DadosRecebimento,
  validarDadosRecebimento,
} from '../componentes/dadosRecebimentoCampos';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './cadastroArtesao.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface Cadastro {
  usarEmailDaConta: boolean;
  emailProfissional: string;
  confirmacaoEmailProfissional: string;
  dadosPessoais: {
    nomeCompleto: string;
    tipoPessoa: 'fisica' | 'juridica';
    documento: string;
    telefone: string;
    endereco: Endereco;
  };
  trabalho: {
    nomePublico: string;
    apresentacao: string;
    artesanato: string;
    tecnicas: string;
    materiais: string;
  };
  dadosFinanceiros: DadosRecebimento;
  aceitaTermos: boolean;
}

const cadastroInicial: Cadastro = {
  usarEmailDaConta: true,
  emailProfissional: '',
  confirmacaoEmailProfissional: '',
  dadosPessoais: {
    nomeCompleto: '',
    tipoPessoa: 'fisica',
    documento: '',
    telefone: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    },
  },
  trabalho: {
    nomePublico: '',
    apresentacao: '',
    artesanato: '',
    tecnicas: '',
    materiais: '',
  },
  dadosFinanceiros: dadosRecebimentoInicial,
  aceitaTermos: false,
};

const etapas = [
  'Dados pessoais',
  'Seu trabalho',
  'Recebimentos',
  'Revisão',
];

const validarDocumentoFiscal = (
  valor: string,
  tipoPessoa: 'fisica' | 'juridica'
) => {
  const documento = valor.replace(/\D/g, '');
  if (tipoPessoa === 'fisica' && documento.length === 11) {
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

  if (tipoPessoa === 'juridica' && documento.length === 14) {
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

const formatarDocumentoFiscal = (
  valor: string,
  tipoPessoa: 'fisica' | 'juridica'
) => {
  const limite = tipoPessoa === 'fisica' ? 11 : 14;
  const digitos = valor.replace(/\D/g, '').slice(0, limite);

  if (tipoPessoa === 'fisica') {
    if (digitos.length > 9) {
      return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
    }
    if (digitos.length > 6) {
      return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
    }
    if (digitos.length > 3) {
      return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    }
    return digitos;
  }

  if (digitos.length > 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
  }
  if (digitos.length > 8) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }
  if (digitos.length > 5) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  }
  if (digitos.length > 2) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  }
  return digitos;
};

const formatarTelefone = (valor: string) => {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;

  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const tamanhoPrefixo =
    digitos.length > 10 || numero.startsWith('9') ? 5 : 4;

  if (numero.length <= tamanhoPrefixo) {
    return `(${ddd}) ${numero}`;
  }

  return `(${ddd}) ${numero.slice(0, tamanhoPrefixo)}-${numero.slice(tamanhoPrefixo)}`;
};

function CadastroArtesao() {
  const { user, isAdmin, isArtisan, isUser } = useAuth();
  const { mostrarNotificacao } = useNotificacao();
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(0);
  const [cadastro, setCadastro] = useState<Cadastro>(cadastroInicial);
  const [erroFormulario, setErroFormulario] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (isAdmin || isArtisan) return <Navigate to="/admin" replace />;
  if (!isUser) return <Navigate to="/" replace />;

  const atualizarPessoal = (
    campo: keyof Cadastro['dadosPessoais'],
    valor: string
  ) => {
    setCadastro((atual) => ({
      ...atual,
      dadosPessoais: { ...atual.dadosPessoais, [campo]: valor },
    }));
  };

  const atualizarTipoPessoa = (tipoPessoa: 'fisica' | 'juridica') => {
    setCadastro((atual) => ({
      ...atual,
      dadosPessoais: {
        ...atual.dadosPessoais,
        tipoPessoa,
        documento: formatarDocumentoFiscal(
          atual.dadosPessoais.documento,
          tipoPessoa
        ),
      },
    }));
  };

  const atualizarEndereco = (campo: keyof Endereco, valor: string) => {
    setCadastro((atual) => ({
      ...atual,
      dadosPessoais: {
        ...atual.dadosPessoais,
        endereco: { ...atual.dadosPessoais.endereco, [campo]: valor },
      },
    }));
  };

  const atualizarTrabalho = (
    campo: keyof Cadastro['trabalho'],
    valor: string
  ) => {
    setCadastro((atual) => ({
      ...atual,
      trabalho: { ...atual.trabalho, [campo]: valor },
    }));
  };

  const atualizarFinanceiro = (dadosFinanceiros: DadosRecebimento) => {
    setCadastro((atual) => ({
      ...atual,
      dadosFinanceiros,
    }));
  };

  const validarEtapa = (): string | null => {
    if (etapa === 0) {
      const dados = cadastro.dadosPessoais;
      if (dados.nomeCompleto.trim().length < 3) {
        return 'Nome completo: informe pelo menos 3 caracteres.';
      }
      if (!validarDocumentoFiscal(dados.documento, dados.tipoPessoa)) {
        return `${dados.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'} do responsável: confira o número e os dígitos verificadores.`;
      }
      if (dados.telefone.replace(/\D/g, '').length < 10) {
        return 'Telefone / WhatsApp: informe pelo menos 10 dígitos.';
      }

      const emailProfissional = cadastro.usarEmailDaConta
        ? user?.email?.trim().toLowerCase() ?? ''
        : cadastro.emailProfissional.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailProfissional)) {
        return 'E-mail profissional: informe um endereço válido.';
      }
      if (
        !cadastro.usarEmailDaConta &&
        emailProfissional !==
          cadastro.confirmacaoEmailProfissional.trim().toLowerCase()
      ) {
        return 'Confirmação do e-mail: os endereços não coincidem.';
      }

      const endereco = dados.endereco;
      if (endereco.cep.replace(/\D/g, '').length !== 8) {
        return 'CEP: informe os 8 dígitos.';
      }
      if (!/^[A-Z]{2}$/.test(endereco.estado.trim().toUpperCase())) {
        return 'Estado (UF): informe duas letras, como GO.';
      }
      if (!endereco.logradouro.trim()) return 'Logradouro: preencha este campo.';
      if (!endereco.numero.trim()) return 'Número: preencha este campo.';
      if (!endereco.bairro.trim()) return 'Bairro: preencha este campo.';
      if (!endereco.cidade.trim()) return 'Cidade: preencha este campo.';
    }

    if (etapa === 1) {
      const trabalho = cadastro.trabalho;
      if (!trabalho.nomePublico.trim()) {
        return 'Nome público do artesão: preencha este campo.';
      }
      if (!trabalho.apresentacao.trim()) {
        return 'Apresentação: conte um pouco sobre você.';
      }
      if (!trabalho.artesanato.trim()) {
        return 'Tipo de artesanato: informe o que você produz.';
      }
      if (!trabalho.tecnicas.trim()) {
        return 'Técnicas utilizadas: preencha este campo.';
      }
      if (!trabalho.materiais.trim()) {
        return 'Materiais utilizados: preencha este campo.';
      }
    }

    if (etapa === 2) {
      return validarDadosRecebimento(cadastro.dadosFinanceiros);
    }

    if (etapa === 3 && !cadastro.aceitaTermos) {
      return 'Confirmação dos termos: marque o aceite para concluir o cadastro.';
    }

    return null;
  };

  const exibirErroValidacao = (mensagem: string) => {
    setErroFormulario(mensagem);
    mostrarNotificacao(mensagem, 'erro');
  };

  const avancarEtapa = () => {
    setErroFormulario('');
    const erro = validarEtapa();
    if (erro) {
      exibirErroValidacao(erro);
      return;
    }
    if (etapa < etapas.length - 1) setEtapa((atual) => atual + 1);
  };

  const concluirCadastro = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (etapa < etapas.length - 1) {
      avancarEtapa();
      return;
    }

    const erro = validarEtapa();
    if (erro) {
      exibirErroValidacao(erro);
      return;
    }

    setEnviando(true);
    setErroFormulario('');
    try {
      await axios.post(
        `${API_URL}/usuarios/artesao`,
        {
          ...cadastro,
          emailProfissional: cadastro.usarEmailDaConta
            ? user?.email
            : cadastro.emailProfissional,
        },
        { withCredentials: true }
      );

      mostrarNotificacao(
        'Cadastro concluído. Seus dados de recebimento foram armazenados de forma protegida.',
        'sucesso'
      );
      window.location.assign('/admin');
    } catch (error) {
      console.error('Erro ao concluir cadastro de artesão:', error);
      const mensagem = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      setErroFormulario(
        mensagem ||
          'Não foi possível concluir o cadastro. Confira os dados informados e tente novamente.'
      );
    } finally {
      setEnviando(false);
    }
  };

  const nomeDocumento =
    cadastro.dadosPessoais.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ';
  const enderecoCompleto = cadastro.dadosPessoais.endereco;

  return (
    <div className={styles.paginaCadastro}>
      <BarraNavegacao />
      <main className={styles.conteudo}>
        <header className={styles.cabecalho}>
          <p className={styles.sobretitulo}>Sorriso do Cerrado</p>
          <h1>Seu caminho como artesão começa aqui</h1>
          <p>
            Conte um pouco sobre você e seu trabalho. Vamos preparar seu perfil
            com cuidado, respeitando a identidade de quem faz cada peça.
          </p>
        </header>

        <section className={styles.cartao}>
          <div className={styles.progresso}>
            {etapas.map((nome, indice) => (
              <div
                key={nome}
                className={
                  indice <= etapa ? styles.etapaAtiva : styles.etapa
                }
              >
                <span>{indice + 1}</span>
                <p>{nome}</p>
              </div>
            ))}
          </div>

          <form noValidate onSubmit={concluirCadastro}>
            {etapa === 0 && (
              <section className={styles.conteudoEtapa}>
                <div className={styles.tituloEtapa}>
                  <h2>Dados pessoais e contato profissional</h2>
                  <p>Precisamos saber quem está por trás do seu trabalho.</p>
                </div>

                <label className={styles.campo}>
                  <span>Nome completo do responsável *</span>
                  <input
                    value={cadastro.dadosPessoais.nomeCompleto}
                    onChange={(event) =>
                      atualizarPessoal('nomeCompleto', event.target.value)
                    }
                    autoComplete="name"
                    required
                  />
                </label>

                <fieldset className={styles.grupoCampos}>
                  <legend>Tipo de pessoa *</legend>
                  <label className={styles.opcao}>
                    <input
                      type="radio"
                      name="tipoPessoa"
                      checked={cadastro.dadosPessoais.tipoPessoa === 'fisica'}
                      onChange={() => atualizarTipoPessoa('fisica')}
                    />
                    Pessoa física
                  </label>
                  <label className={styles.opcao}>
                    <input
                      type="radio"
                      name="tipoPessoa"
                      checked={
                        cadastro.dadosPessoais.tipoPessoa === 'juridica'
                      }
                      onChange={() => atualizarTipoPessoa('juridica')}
                    />
                    Pessoa jurídica
                  </label>
                </fieldset>

                <div className={styles.duasColunas}>
                  <label className={styles.campo}>
                    <span>{nomeDocumento} do responsável *</span>
                    <input
                      value={cadastro.dadosPessoais.documento}
                      onChange={(event) =>
                        atualizarPessoal(
                          'documento',
                          formatarDocumentoFiscal(
                            event.target.value,
                            cadastro.dadosPessoais.tipoPessoa
                          )
                        )
                      }
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={
                        cadastro.dadosPessoais.tipoPessoa === 'fisica'
                          ? 14
                          : 18
                      }
                      required
                    />
                  </label>
                  <label className={styles.campo}>
                    <span>Telefone / WhatsApp *</span>
                    <input
                      type="tel"
                      value={cadastro.dadosPessoais.telefone}
                      onChange={(event) =>
                        atualizarPessoal(
                          'telefone',
                          formatarTelefone(event.target.value)
                        )
                      }
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={15}
                      required
                    />
                  </label>
                </div>

                <fieldset className={styles.blocoEmail}>
                  <legend>E-mail para contato profissional *</legend>
                  <label className={styles.opcao}>
                    <input
                      type="radio"
                      name="emailProfissional"
                      checked={cadastro.usarEmailDaConta}
                      onChange={() =>
                        setCadastro((atual) => ({
                          ...atual,
                          usarEmailDaConta: true,
                        }))
                      }
                    />
                    Usar o e-mail da minha conta ({user?.email})
                  </label>
                  <label className={styles.opcao}>
                    <input
                      type="radio"
                      name="emailProfissional"
                      checked={!cadastro.usarEmailDaConta}
                      onChange={() =>
                        setCadastro((atual) => ({
                          ...atual,
                          usarEmailDaConta: false,
                        }))
                      }
                    />
                    Informar outro e-mail profissional
                  </label>
                  {!cadastro.usarEmailDaConta && (
                    <div className={styles.duasColunas}>
                      <label className={styles.campo}>
                        <span>Novo e-mail profissional *</span>
                        <input
                          type="email"
                          value={cadastro.emailProfissional}
                          onChange={(event) =>
                            setCadastro((atual) => ({
                              ...atual,
                              emailProfissional: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label className={styles.campo}>
                        <span>Confirme o e-mail profissional *</span>
                        <input
                          type="email"
                          value={cadastro.confirmacaoEmailProfissional}
                          onChange={(event) =>
                            setCadastro((atual) => ({
                              ...atual,
                              confirmacaoEmailProfissional: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                    </div>
                  )}
                  <p className={styles.ajuda}>
                    Este contato não altera o e-mail usado para entrar na
                    plataforma.
                  </p>
                </fieldset>

                <div className={styles.tituloGrupo}>Endereço completo</div>
                <div className={styles.duasColunas}>
                  <label className={styles.campo}>
                    <span>CEP *</span>
                    <input
                      value={enderecoCompleto.cep}
                      onChange={(event) =>
                        atualizarEndereco('cep', event.target.value)
                      }
                      autoComplete="postal-code"
                      required
                    />
                  </label>
                  <label className={styles.campo}>
                    <span>Estado (UF) *</span>
                    <input
                      value={enderecoCompleto.estado}
                      onChange={(event) =>
                        atualizarEndereco('estado', event.target.value)
                      }
                      maxLength={2}
                      autoComplete="address-level1"
                      required
                    />
                  </label>
                  <label className={styles.campo}>
                    <span>Logradouro *</span>
                    <input
                      value={enderecoCompleto.logradouro}
                      onChange={(event) =>
                        atualizarEndereco('logradouro', event.target.value)
                      }
                      autoComplete="street-address"
                      required
                    />
                  </label>
                  <label className={styles.campo}>
                    <span>Número *</span>
                    <input
                      value={enderecoCompleto.numero}
                      onChange={(event) =>
                        atualizarEndereco('numero', event.target.value)
                      }
                      required
                    />
                  </label>
                  <label className={styles.campo}>
                    <span>Complemento</span>
                    <input
                      value={enderecoCompleto.complemento}
                      onChange={(event) =>
                        atualizarEndereco('complemento', event.target.value)
                      }
                    />
                  </label>
                  <label className={styles.campo}>
                    <span>Bairro *</span>
                    <input
                      value={enderecoCompleto.bairro}
                      onChange={(event) =>
                        atualizarEndereco('bairro', event.target.value)
                      }
                      required
                    />
                  </label>
                  <label className={styles.campo}>
                    <span>Cidade *</span>
                    <input
                      value={enderecoCompleto.cidade}
                      onChange={(event) =>
                        atualizarEndereco('cidade', event.target.value)
                      }
                      autoComplete="address-level2"
                      required
                    />
                  </label>
                </div>
              </section>
            )}

            {etapa === 1 && (
              <section className={styles.conteudoEtapa}>
                <div className={styles.tituloEtapa}>
                  <h2>Sobre você e seu trabalho</h2>
                  <p>
                    Este espaço apresenta a pessoa artesã e as técnicas que
                    tornam suas criações únicas.
                  </p>
                </div>

                <label className={styles.campo}>
                  <span>Nome público do artesão *</span>
                  <input
                    value={cadastro.trabalho.nomePublico}
                    onChange={(event) =>
                      atualizarTrabalho('nomePublico', event.target.value)
                    }
                    required
                  />
                </label>
                <label className={styles.campo}>
                  <span>Apresente-se *</span>
                  <textarea
                    value={cadastro.trabalho.apresentacao}
                    onChange={(event) =>
                      atualizarTrabalho('apresentacao', event.target.value)
                    }
                    rows={4}
                    required
                  />
                </label>
                <label className={styles.campo}>
                  <span>Tipo de artesanato produzido *</span>
                  <input
                    value={cadastro.trabalho.artesanato}
                    onChange={(event) =>
                      atualizarTrabalho('artesanato', event.target.value)
                    }
                    required
                  />
                </label>
                <div className={styles.duasColunas}>
                  <label className={styles.campo}>
                    <span>Técnicas utilizadas *</span>
                    <textarea
                      value={cadastro.trabalho.tecnicas}
                      onChange={(event) =>
                        atualizarTrabalho('tecnicas', event.target.value)
                      }
                      rows={3}
                      required
                    />
                  </label>
                  <label className={styles.campo}>
                    <span>Materiais utilizados *</span>
                    <textarea
                      value={cadastro.trabalho.materiais}
                      onChange={(event) =>
                        atualizarTrabalho('materiais', event.target.value)
                      }
                      rows={3}
                      required
                    />
                  </label>
                </div>
              </section>
            )}

            {etapa === 2 && (
              <section className={styles.conteudoEtapa}>
                <div className={styles.tituloEtapa}>
                  <h2>Identificação e recebimentos</h2>
                  <p>
                    Informe como prefere receber seus pagamentos futuros. Os
                    dados serão armazenados de forma criptografada.
                  </p>
                </div>
                <DadosRecebimentoCampos
                  value={cadastro.dadosFinanceiros}
                  onChange={atualizarFinanceiro}
                />
              </section>
            )}

            {etapa === 3 && (
              <section className={styles.conteudoEtapa}>
                <div className={styles.tituloEtapa}>
                  <h2>Revise e confirme</h2>
                  <p>
                    Confira os dados antes de concluir. O e-mail de acesso à
                    plataforma não será alterado.
                  </p>
                </div>

                <div className={styles.resumo}>
                  <section>
                    <div className={styles.cabecalhoResumo}>
                      <h3>Dados pessoais e contato</h3>
                      <button type="button" onClick={() => setEtapa(0)}>
                        Corrigir
                      </button>
                    </div>
                    <p>
                      <strong>Responsável:</strong>{' '}
                      {cadastro.dadosPessoais.nomeCompleto}
                    </p>
                    <p>
                      <strong>{nomeDocumento}:</strong>{' '}
                      {cadastro.dadosPessoais.documento}
                    </p>
                    <p>
                      <strong>Telefone:</strong>{' '}
                      {cadastro.dadosPessoais.telefone}
                    </p>
                    <p>
                      <strong>E-mail profissional:</strong>{' '}
                      {cadastro.usarEmailDaConta
                        ? user?.email
                        : cadastro.emailProfissional}
                    </p>
                    <p>
                      <strong>Endereço:</strong>{' '}
                      {[
                        enderecoCompleto.logradouro,
                        enderecoCompleto.numero,
                        enderecoCompleto.bairro,
                        enderecoCompleto.cidade,
                        enderecoCompleto.estado,
                        enderecoCompleto.cep,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </section>
                  <section>
                    <div className={styles.cabecalhoResumo}>
                      <h3>Seu trabalho</h3>
                      <button type="button" onClick={() => setEtapa(1)}>
                        Corrigir
                      </button>
                    </div>
                    <p>
                      <strong>Nome público:</strong> {cadastro.trabalho.nomePublico}
                    </p>
                    <p>
                      <strong>Apresentação:</strong>{' '}
                      {cadastro.trabalho.apresentacao}
                    </p>
                    <p>
                      <strong>Artesanato:</strong> {cadastro.trabalho.artesanato}
                    </p>
                    <p>
                      <strong>Técnicas:</strong> {cadastro.trabalho.tecnicas}
                    </p>
                    <p>
                      <strong>Materiais:</strong> {cadastro.trabalho.materiais}
                    </p>
                  </section>
                  <section>
                    <div className={styles.cabecalhoResumo}>
                      <h3>Recebimentos</h3>
                      <button type="button" onClick={() => setEtapa(2)}>
                        Corrigir
                      </button>
                    </div>
                    {cadastro.dadosFinanceiros.pix && (
                      <p>
                        <strong>
                          Chave Pix (
                          {cadastro.dadosFinanceiros.pix.tipoChavePix}):
                        </strong>{' '}
                        {cadastro.dadosFinanceiros.pix.chavePix}
                      </p>
                    )}
                    {cadastro.dadosFinanceiros.transferencia && (
                      <>
                        <p>
                          <strong>Banco:</strong>{' '}
                          {cadastro.dadosFinanceiros.transferencia.banco}
                        </p>
                        <p>
                          <strong>Agência e conta:</strong>{' '}
                          {cadastro.dadosFinanceiros.transferencia.agencia} /{' '}
                          {cadastro.dadosFinanceiros.transferencia.numeroConta}
                          {cadastro.dadosFinanceiros.transferencia.digitoConta
                            ? `-${cadastro.dadosFinanceiros.transferencia.digitoConta}`
                            : ''}
                        </p>
                        <p>
                          <strong>Tipo:</strong>{' '}
                          {cadastro.dadosFinanceiros.transferencia.tipoConta ===
                          'corrente'
                            ? 'Corrente'
                            : 'Poupança'}
                        </p>
                      </>
                    )}
                  </section>
                </div>

                <div className={styles.termos}>
                  <h3>Termos e condições para artesãos</h3>
                  <ul>
                    <li>
                      Declaro que as informações fornecidas são verdadeiras e
                      que a chave Pix ou conta bancária informada poderá ser
                      utilizada para pagamentos futuros.
                    </li>
                  </ul>
                  <label className={styles.aceite}>
                    <input
                      type="checkbox"
                      checked={cadastro.aceitaTermos}
                      onChange={(event) =>
                        setCadastro((atual) => ({
                          ...atual,
                          aceitaTermos: event.target.checked,
                        }))
                      }
                      required
                    />
                    <span>
                      Confirmo a veracidade dos dados e aceito os termos e
                      condições acima. *
                    </span>
                  </label>
                </div>
              </section>
            )}

            {erroFormulario && (
              <p className={styles.erroFormulario} role="alert">
                {erroFormulario}
              </p>
            )}

            <div className={styles.acoes}>
              {etapa > 0 && (
                <button
                  type="button"
                  className={styles.botaoVoltar}
                  onClick={() => {
                    setErroFormulario('');
                    setEtapa((atual) => atual - 1);
                  }}
                  disabled={enviando}
                >
                  Voltar
                </button>
              )}
              <button
                type="submit"
                className={styles.botaoAvancar}
                disabled={enviando}
              >
                {enviando
                  ? 'Concluindo cadastro...'
                  : etapa === etapas.length - 1
                    ? 'Concluir cadastro'
                    : 'Continuar'}
              </button>
            </div>
          </form>
        </section>
      </main>
      <Rodape />
    </div>
  );
}

export default CadastroArtesao;
