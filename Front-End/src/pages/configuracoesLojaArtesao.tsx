import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DadosRecebimentoCampos, {
  dadosRecebimentoInicial,
  type DadosRecebimento,
  validarDadosRecebimento,
} from '../componentes/dadosRecebimentoCampos';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import styles from './configuracoesLojaArtesao.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CATEGORIAS_LOJA = [
  'Moda e acessórios',
  'Joias e bijuterias',
  'Crochê e peças artesanais',
  'Decoração',
  'Organização e armazenamento',
  'Mesa e cozinha',
  'Aromas e cuidados pessoais',
  'Jardim e plantas',
  'Presentes e lembranças',
];

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

interface EnderecoLoja {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface PerfilLojaArtesao {
  dadosPessoais: {
    nomeCompleto: string;
    tipoPessoa: 'fisica' | 'juridica';
    documento: string;
    telefone: string;
    emailProfissional: string;
    endereco: EnderecoLoja;
  };
  trabalho: {
    nomePublico: string;
    apresentacao: string;
    artesanato: string;
    tecnicas: string;
    materiais: string;
    categoriaPrincipal?: string;
    logoURL?: string;
    capaURL?: string;
    prazoProducao?: string;
    envio?: string;
    formasPagamento?: string;
  };
  dadosFinanceiros: DadosRecebimento;
}

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

const obterIniciais = (texto: string) => {
  const partes = texto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'AD';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
};

function ConfiguracoesLojaArtesao() {
  const { user } = useAuth();
  const { mostrarNotificacao } = useNotificacao();

  const inputLogoRef = useRef<HTMLInputElement>(null);
  const inputCapaRef = useRef<HTMLInputElement>(null);

  const criarPerfilPadrao = (): PerfilLojaArtesao => ({
    dadosPessoais: {
      nomeCompleto: user?.name || '',
      tipoPessoa: 'fisica',
      documento: '',
      telefone: '',
      emailProfissional: user?.email || '',
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: 'GO',
      },
    },
    trabalho: {
      nomePublico: user?.name || 'Ateliê Dona Maria',
      apresentacao: '',
      artesanato: '',
      tecnicas: '',
      materiais: '',
      categoriaPrincipal: 'Crochê e peças artesanais',
      logoURL: '',
      capaURL: '',
      prazoProducao: '5 a 10 dias',
      envio: 'Todo o Brasil',
      formasPagamento: 'Pix',
    },
    dadosFinanceiros: dadosRecebimentoInicial,
  });

  const [dados, setDados] = useState<PerfilLojaArtesao>(criarPerfilPadrao);
  const [dadosOriginais, setDadosOriginais] =
    useState<PerfilLojaArtesao>(criarPerfilPadrao);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoCapa, setEnviandoCapa] = useState(false);

  useEffect(() => {
    let ativo = true;

    const carregarPerfil = async () => {
      setCarregando(true);
      try {
        const { data } = await axios.get<{ perfil: PerfilLojaArtesao | null }>(
          `${API_URL}/usuarios/artesao/perfil`,
          { withCredentials: true }
        );

        if (!ativo) return;

        if (data.perfil) {
          const perfilFormatado: PerfilLojaArtesao = {
            dadosPessoais: {
              nomeCompleto: data.perfil.dadosPessoais.nomeCompleto || '',
              tipoPessoa: data.perfil.dadosPessoais.tipoPessoa || 'fisica',
              documento: formatarDocumentoFiscal(
                data.perfil.dadosPessoais.documento || '',
                data.perfil.dadosPessoais.tipoPessoa || 'fisica'
              ),
              telefone: formatarTelefone(
                data.perfil.dadosPessoais.telefone || ''
              ),
              emailProfissional:
                data.perfil.dadosPessoais.emailProfissional ||
                user?.email ||
                '',
              endereco: {
                cep: data.perfil.dadosPessoais.endereco?.cep || '',
                logradouro: data.perfil.dadosPessoais.endereco?.logradouro || '',
                numero: data.perfil.dadosPessoais.endereco?.numero || '',
                complemento:
                  data.perfil.dadosPessoais.endereco?.complemento || '',
                bairro: data.perfil.dadosPessoais.endereco?.bairro || '',
                cidade: data.perfil.dadosPessoais.endereco?.cidade || '',
                estado: data.perfil.dadosPessoais.endereco?.estado || 'GO',
              },
            },
            trabalho: {
              nomePublico: data.perfil.trabalho.nomePublico || '',
              apresentacao: data.perfil.trabalho.apresentacao || '',
              artesanato: data.perfil.trabalho.artesanato || '',
              tecnicas: data.perfil.trabalho.tecnicas || '',
              materiais: data.perfil.trabalho.materiais || '',
              categoriaPrincipal:
                data.perfil.trabalho.categoriaPrincipal ||
                'Crochê e peças artesanais',
              logoURL: data.perfil.trabalho.logoURL || '',
              capaURL: data.perfil.trabalho.capaURL || '',
              prazoProducao:
                data.perfil.trabalho.prazoProducao || '5 a 10 dias',
              envio: data.perfil.trabalho.envio || 'Todo o Brasil',
              formasPagamento: data.perfil.trabalho.formasPagamento || 'Pix',
            },
            dadosFinanceiros:
              data.perfil.dadosFinanceiros || dadosRecebimentoInicial,
          };

          setDados(perfilFormatado);
          setDadosOriginais(perfilFormatado);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações da loja:', error);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [user?.email, user?.name]);

  const atualizarTrabalho = (
    campo: keyof PerfilLojaArtesao['trabalho'],
    valor: string
  ) => {
    setDados((atual) => ({
      ...atual,
      trabalho: { ...atual.trabalho, [campo]: valor },
    }));
  };

  const atualizarPessoal = (
    campo: keyof PerfilLojaArtesao['dadosPessoais'],
    valor: string
  ) => {
    setDados((atual) => ({
      ...atual,
      dadosPessoais: { ...atual.dadosPessoais, [campo]: valor },
    }));
  };

  const atualizarTipoPessoa = (tipoPessoa: 'fisica' | 'juridica') => {
    setDados((atual) => ({
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

  const atualizarEndereco = (campo: keyof EnderecoLoja, valor: string) => {
    setDados((atual) => ({
      ...atual,
      dadosPessoais: {
        ...atual.dadosPessoais,
        endereco: { ...atual.dadosPessoais.endereco, [campo]: valor },
      },
    }));
  };

  const handleUploadImagem = async (
    arquivo: File,
    tipo: 'logoURL' | 'capaURL'
  ) => {
    if (!arquivo.type.startsWith('image/')) {
      mostrarNotificacao('Selecione um arquivo de imagem válido.', 'erro');
      return;
    }

    if (tipo === 'logoURL') setEnviandoLogo(true);
    else setEnviandoCapa(true);

    try {
      const formData = new FormData();
      formData.append('imagem', arquivo);

      const { data } = await axios.post<{ url: string }>(
        `${API_URL}/upload`,
        formData,
        { withCredentials: true }
      );

      atualizarTrabalho(tipo, data.url);
      mostrarNotificacao(
        tipo === 'logoURL'
          ? 'Logo carregada! Clique em "Salvar alterações" para gravar.'
          : 'Imagem de capa carregada! Clique em "Salvar alterações" para gravar.',
        'sucesso'
      );
    } catch (error) {
      console.error('Erro ao enviar imagem da loja:', error);
      mostrarNotificacao('Não foi possível enviar a imagem.', 'erro');
    } finally {
      if (tipo === 'logoURL') setEnviandoLogo(false);
      else setEnviandoCapa(false);
    }
  };

  const handleDescartar = () => {
    setDados(dadosOriginais);
    setModoEdicao(false);
    mostrarNotificacao('Edição cancelada.', 'aviso');
  };

  const handleSalvar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modoEdicao) return;

    const erroRecebimento = validarDadosRecebimento(dados.dadosFinanceiros);
    if (erroRecebimento) {
      mostrarNotificacao(erroRecebimento, 'erro');
      return;
    }

    setSalvando(true);
    try {
      await axios.put(
        `${API_URL}/usuarios/artesao/perfil`,
        {
          emailProfissional: dados.dadosPessoais.emailProfissional,
          dadosPessoais: dados.dadosPessoais,
          trabalho: dados.trabalho,
          dadosFinanceiros: dados.dadosFinanceiros,
        },
        { withCredentials: true }
      );

      setDadosOriginais(dados);
      setModoEdicao(false);
      mostrarNotificacao(
        'Configurações da loja atualizadas com sucesso!',
        'sucesso'
      );
    } catch (error) {
      console.error('Erro ao salvar configurações da loja:', error);
      const mensagem = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      mostrarNotificacao(
        mensagem || 'Não foi possível salvar as configurações da loja.',
        'erro'
      );
    } finally {
      setSalvando(false);
    }
  };

  const nomeDocumento =
    dados.dadosPessoais.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ';

  if (carregando) {
    return (
      <div className={styles.paginaConfigLoja}>
        <p className={styles.estadoCarregando}>
          Carregando configurações da loja...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.paginaConfigLoja}>
      <header className={styles.cabecalho}>
        <div>
          <h1>Minha loja</h1>
          <p className={styles.descricao}>
            Edite as informações da loja e gerencie todos os dados fornecidos no
            cadastro
          </p>
        </div>

        <div className={styles.acoesCabecalho}>
          {!modoEdicao && (
            <button
              type="button"
              className={styles.botaoEditar}
              onClick={() => setModoEdicao(true)}
            >
              Editar
            </button>
          )}

          <Link to="/loja-artesao" className={styles.botaoVerLoja}>
            Ver minha loja
          </Link>
        </div>
      </header>

      <form onSubmit={handleSalvar} className={styles.cartaoFormulario}>
        <fieldset disabled={!modoEdicao} className={styles.fieldsetBloqueio}>
        {/* SEÇÃO 1: INFORMAÇÕES DA LOJA E SEU TRABALHO */}
        <section className={styles.blocoSecao}>
          <div className={styles.tituloBloco}>
            <h2>Informações da loja</h2>
            <p>Estes dados aparecem na página pública da sua loja.</p>
          </div>

          <div className={styles.identidadeVisual}>
            <div className={styles.colunaLogo}>
              <button
                type="button"
                className={styles.circuloLogo}
                onClick={() => inputLogoRef.current?.click()}
                disabled={enviandoLogo}
                title="Trocar logo da loja"
              >
                {dados.trabalho.logoURL ? (
                  <img
                    src={dados.trabalho.logoURL}
                    alt="Logo da loja"
                    className={styles.imagemLogo}
                  />
                ) : (
                  <span>{obterIniciais(dados.trabalho.nomePublico)}</span>
                )}
              </button>
              <button
                type="button"
                className={styles.botaoTrocarLogo}
                onClick={() => inputLogoRef.current?.click()}
                disabled={enviandoLogo}
              >
                {enviandoLogo ? 'Enviando...' : 'Trocar logo'}
              </button>
              <input
                ref={inputLogoRef}
                type="file"
                accept="image/*"
                className={styles.inputOculto}
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  e.target.value = '';
                  if (arquivo) void handleUploadImagem(arquivo, 'logoURL');
                }}
              />
            </div>

            <button
              type="button"
              className={styles.areaCapa}
              onClick={() => inputCapaRef.current?.click()}
              disabled={enviandoCapa}
            >
              {dados.trabalho.capaURL ? (
                <img
                  src={dados.trabalho.capaURL}
                  alt="Capa da loja"
                  className={styles.imagemCapaPreview}
                />
              ) : (
                <div className={styles.conteudoUploadCapa}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>
                    {enviandoCapa
                      ? 'Enviando imagem de capa...'
                      : 'Enviar imagem de capa'}
                  </span>
                </div>
              )}
              <input
                ref={inputCapaRef}
                type="file"
                accept="image/*"
                className={styles.inputOculto}
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  e.target.value = '';
                  if (arquivo) void handleUploadImagem(arquivo, 'capaURL');
                }}
              />
            </button>
          </div>

          <div className={styles.duasColunas}>
            <label className={styles.campo}>
              <span>Nome da loja (Nome público do artesão) *</span>
              <input
                type="text"
                value={dados.trabalho.nomePublico}
                onChange={(e) =>
                  atualizarTrabalho('nomePublico', e.target.value)
                }
                required
              />
            </label>

            <label className={styles.campo}>
              <span>Categoria principal *</span>
              <select
                value={dados.trabalho.categoriaPrincipal || ''}
                onChange={(e) =>
                  atualizarTrabalho('categoriaPrincipal', e.target.value)
                }
                required
              >
                {CATEGORIAS_LOJA.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.tresColunas}>
            <label className={styles.campo}>
              <span>Cidade *</span>
              <input
                type="text"
                value={dados.dadosPessoais.endereco.cidade}
                onChange={(e) => atualizarEndereco('cidade', e.target.value)}
                required
              />
            </label>

            <label className={styles.campo}>
              <span>Estado *</span>
              <select
                value={dados.dadosPessoais.endereco.estado}
                onChange={(e) => atualizarEndereco('estado', e.target.value)}
                required
              >
                {ESTADOS_BRASIL.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.campo}>
              <span>WhatsApp para contato *</span>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={dados.dadosPessoais.telefone}
                onChange={(e) =>
                  atualizarPessoal('telefone', formatarTelefone(e.target.value))
                }
                maxLength={15}
                required
              />
            </label>
          </div>

          <label className={styles.campo}>
            <span>Descrição da loja (Apresentação) *</span>
            <textarea
              rows={4}
              value={dados.trabalho.apresentacao}
              onChange={(e) =>
                atualizarTrabalho('apresentacao', e.target.value)
              }
              required
            />
          </label>

          <label className={styles.campo}>
            <span>Tipo de artesanato produzido *</span>
            <input
              type="text"
              value={dados.trabalho.artesanato}
              onChange={(e) => atualizarTrabalho('artesanato', e.target.value)}
              required
            />
          </label>

          <div className={styles.duasColunas}>
            <label className={styles.campo}>
              <span>Técnicas utilizadas *</span>
              <textarea
                rows={3}
                value={dados.trabalho.tecnicas}
                onChange={(e) => atualizarTrabalho('tecnicas', e.target.value)}
                required
              />
            </label>

            <label className={styles.campo}>
              <span>Materiais utilizados *</span>
              <textarea
                rows={3}
                value={dados.trabalho.materiais}
                onChange={(e) => atualizarTrabalho('materiais', e.target.value)}
                required
              />
            </label>
          </div>

          <div className={styles.tresColunas}>
            <label className={styles.campo}>
              <span>Prazo de produção</span>
              <input
                type="text"
                placeholder="Ex: 5 a 10 dias"
                value={dados.trabalho.prazoProducao || ''}
                onChange={(e) =>
                  atualizarTrabalho('prazoProducao', e.target.value)
                }
              />
            </label>

            <label className={styles.campo}>
              <span>Envio</span>
              <select
                value={dados.trabalho.envio || 'Todo o Brasil'}
                onChange={(e) => atualizarTrabalho('envio', e.target.value)}
              >
                <option value="Todo o Brasil">Todo o Brasil</option>
                <option value="Regional (Centro-Oeste)">
                  Regional (Centro-Oeste)
                </option>
                <option value="Apenas retirada local">
                  Apenas retirada local
                </option>
              </select>
            </label>

            <label className={styles.campo}>
              <span>Formas de pagamento</span>
              <select
                value={dados.trabalho.formasPagamento || 'Pix'}
                onChange={(e) =>
                  atualizarTrabalho('formasPagamento', e.target.value)
                }
              >
                <option value="Pix">Pix</option>
                <option value="Pix e Cartão">Pix e Cartão</option>
                <option value="Pix, Cartão e Boleto">
                  Pix, Cartão e Boleto
                </option>
              </select>
            </label>
          </div>
        </section>

        {/* SEÇÃO 2: DADOS PESSOAIS E CONTATO PROFISSIONAL */}
        <section className={styles.blocoSecao}>
          <div className={styles.tituloBloco}>
            <h2>Dados pessoais e contato profissional</h2>
            <p>Informações do responsável cadastradas em Torne-se um artesão.</p>
          </div>

          <div className={styles.duasColunas}>
            <label className={styles.campo}>
              <span>Nome completo do responsável *</span>
              <input
                type="text"
                value={dados.dadosPessoais.nomeCompleto}
                onChange={(e) =>
                  atualizarPessoal('nomeCompleto', e.target.value)
                }
                required
              />
            </label>

            <label className={styles.campo}>
              <span>E-mail para contato profissional *</span>
              <input
                type="email"
                value={dados.dadosPessoais.emailProfissional}
                onChange={(e) =>
                  atualizarPessoal('emailProfissional', e.target.value)
                }
                required
              />
            </label>
          </div>

          <div className={styles.duasColunas}>
            <fieldset className={styles.grupoRadio}>
              <legend>Tipo de pessoa *</legend>
              <label className={styles.opcaoRadio}>
                <input
                  type="radio"
                  name="tipoPessoaLoja"
                  checked={dados.dadosPessoais.tipoPessoa === 'fisica'}
                  onChange={() => atualizarTipoPessoa('fisica')}
                />
                Pessoa física
              </label>
              <label className={styles.opcaoRadio}>
                <input
                  type="radio"
                  name="tipoPessoaLoja"
                  checked={dados.dadosPessoais.tipoPessoa === 'juridica'}
                  onChange={() => atualizarTipoPessoa('juridica')}
                />
                Pessoa jurídica
              </label>
            </fieldset>

            <label className={styles.campo}>
              <span>{nomeDocumento} do responsável *</span>
              <input
                type="text"
                inputMode="numeric"
                value={dados.dadosPessoais.documento}
                onChange={(e) =>
                  atualizarPessoal(
                    'documento',
                    formatarDocumentoFiscal(
                      e.target.value,
                      dados.dadosPessoais.tipoPessoa
                    )
                  )
                }
                maxLength={
                  dados.dadosPessoais.tipoPessoa === 'fisica' ? 14 : 18
                }
                required
              />
            </label>
          </div>
        </section>

        {/* SEÇÃO 3: ENDEREÇO COMPLETO */}
        <section className={styles.blocoSecao}>
          <div className={styles.tituloBloco}>
            <h2>Endereço completo</h2>
            <p>Endereço cadastrado do ateliê / responsável.</p>
          </div>

          <div className={styles.tresColunas}>
            <label className={styles.campo}>
              <span>CEP *</span>
              <input
                type="text"
                value={dados.dadosPessoais.endereco.cep}
                onChange={(e) => atualizarEndereco('cep', e.target.value)}
                required
              />
            </label>

            <label className={styles.campo}>
              <span>Logradouro *</span>
              <input
                type="text"
                value={dados.dadosPessoais.endereco.logradouro}
                onChange={(e) =>
                  atualizarEndereco('logradouro', e.target.value)
                }
                required
              />
            </label>

            <label className={styles.campo}>
              <span>Número *</span>
              <input
                type="text"
                value={dados.dadosPessoais.endereco.numero}
                onChange={(e) => atualizarEndereco('numero', e.target.value)}
                required
              />
            </label>
          </div>

          <div className={styles.duasColunas}>
            <label className={styles.campo}>
              <span>Complemento</span>
              <input
                type="text"
                value={dados.dadosPessoais.endereco.complemento}
                onChange={(e) =>
                  atualizarEndereco('complemento', e.target.value)
                }
              />
            </label>

            <label className={styles.campo}>
              <span>Bairro *</span>
              <input
                type="text"
                value={dados.dadosPessoais.endereco.bairro}
                onChange={(e) => atualizarEndereco('bairro', e.target.value)}
                required
              />
            </label>
          </div>
        </section>

        {/* SEÇÃO 4: RECEBIMENTOS */}
        <section className={styles.blocoSecao}>
          <div className={styles.tituloBloco}>
            <h2>Identificação e recebimentos</h2>
            <p>
              Dados bancários e chave Pix para repasse das vendas (armazenados
              com criptografia).
            </p>
          </div>

          <DadosRecebimentoCampos
            value={dados.dadosFinanceiros}
            onChange={(dadosFinanceiros) =>
              setDados((atual) => ({ ...atual, dadosFinanceiros }))
            }
            disabled={!modoEdicao}
          />
        </section>
        </fieldset>

        {modoEdicao && (
          <footer className={styles.rodapeAcoes}>
            <button
              type="button"
              className={styles.botaoDescartar}
              onClick={handleDescartar}
              disabled={salvando}
            >
              Descartar
            </button>

            <button
              type="submit"
              className={styles.botaoSalvar}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </footer>
        )}
      </form>
    </div>
  );
}

export default ConfiguracoesLojaArtesao;
