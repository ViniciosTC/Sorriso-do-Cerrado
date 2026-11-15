import type { FastifyReply, FastifyRequest } from "fastify";
import ArtesaoModel from "../models/artesaoModel.js";
import ArtesaoPerfilModel, {
  type DadosCadastroArtesaoLocal,
  type DadosRecebimento,
  type TipoChavePix,
} from "../models/artesaoPerfilModel.js";
import UsuarioModel from "../models/usuarioModel.js";
import {
  consultarSubcontaArtesao,
  obterComissaoArtesao,
  validarConfiguracaoAbacatePay,
} from "../services/abacatePayService.js";

type CorpoCadastroArtesao = {
  usarEmailDaConta?: boolean;
  emailProfissional?: string;
  confirmacaoEmailProfissional?: string;
  aceitaTermos?: boolean;
  dadosPessoais?: {
    nomeCompleto?: string;
    tipoPessoa?: string;
    documento?: string;
    telefone?: string;
    endereco?: Record<string, unknown>;
  };
  trabalho?: {
    nomePublico?: string;
    apresentacao?: string;
    artesanato?: string;
    tecnicas?: string;
    materiais?: string;
  };
  dadosFinanceiros?: {
    pix?: {
      tipoChavePix?: string;
      chavePix?: string;
    };
    transferencia?: {
      banco?: string;
      agencia?: string;
      numeroConta?: string;
      digitoConta?: string;
      tipoConta?: string;
    };
  };
};

const comoTexto = (valor: unknown) =>
  typeof valor === "string" ? valor.trim() : "";

const validarDocumento = (valor: string, tipoPessoa: string) => {
  const documento = valor.replace(/\D/g, "");
  if (tipoPessoa === "fisica" && documento.length === 11) {
    if (/^(\d)\1{10}$/.test(documento)) return false;
    const digitos = documento.slice(0, 9).split("").map(Number);
    const calcularDigito = (numeros: number[], pesoInicial: number) => {
      const soma = numeros.reduce(
        (total, numero, indice) => total + numero * (pesoInicial - indice),
        0,
      );
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };
    const primeiro = calcularDigito(digitos, 10);
    const segundo = calcularDigito([...digitos, primeiro], 11);
    return documento.endsWith(`${primeiro}${segundo}`);
  }

  if (tipoPessoa === "juridica" && documento.length === 14) {
    if (/^(\d)\1{13}$/.test(documento)) return false;
    const calcularDigito = (base: string, pesos: number[]) => {
      const soma = base
        .split("")
        .reduce((total, digito, indice) => total + Number(digito) * pesos[indice], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    const base = documento.slice(0, 12);
    const primeiro = calcularDigito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const segundo = calcularDigito(
      `${base}${primeiro}`,
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    return documento.endsWith(`${primeiro}${segundo}`);
  }

  return false;
};

export const validarDadosRecebimento = (
  dados?: CorpoCadastroArtesao["dadosFinanceiros"],
): DadosRecebimento | null => {
  if (!dados) return null;

  const recebimento: DadosRecebimento = {};
  if (dados.pix) {
    const tipoChavePix = comoTexto(dados.pix.tipoChavePix);
    const chavePix = comoTexto(dados.pix.chavePix);
    const tiposValidos: TipoChavePix[] = [
      "cpf",
      "cnpj",
      "email",
      "telefone",
      "aleatoria",
    ];
    if (
      !tiposValidos.includes(tipoChavePix as TipoChavePix) ||
      chavePix.length > 100
    ) {
      return null;
    }

    const chaveValida =
      (tipoChavePix === "cpf" && validarDocumento(chavePix, "fisica")) ||
      (tipoChavePix === "cnpj" && validarDocumento(chavePix, "juridica")) ||
      (tipoChavePix === "email" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chavePix)) ||
      (tipoChavePix === "telefone" &&
        chavePix.replace(/\D/g, "").length >= 10 &&
        chavePix.replace(/\D/g, "").length <= 13) ||
      (tipoChavePix === "aleatoria" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          chavePix,
        ));
    if (!chaveValida) return null;

    recebimento.pix = {
      tipoChavePix: tipoChavePix as TipoChavePix,
      chavePix,
    };
  }

  if (dados.transferencia) {
    const banco = comoTexto(dados.transferencia.banco);
    const agencia = comoTexto(dados.transferencia.agencia);
    const numeroConta = comoTexto(dados.transferencia.numeroConta);
    const digitoConta = comoTexto(dados.transferencia.digitoConta);
    const tipoConta = comoTexto(dados.transferencia.tipoConta);
    if (
      !banco ||
      banco.length > 100 ||
      !agencia ||
      agencia.length > 20 ||
      !numeroConta ||
      numeroConta.length > 30 ||
      digitoConta.length > 5 ||
      !["corrente", "poupanca"].includes(tipoConta)
    ) {
      return null;
    }

    recebimento.transferencia = {
      banco,
      agencia,
      numeroConta,
      ...(digitoConta ? { digitoConta } : {}),
      tipoConta: tipoConta as "corrente" | "poupanca",
    };
  }

  return recebimento.pix || recebimento.transferencia ? recebimento : null;
};

const respostaErro = (
  reply: FastifyReply,
  statusCode: number,
  error: string,
) => reply.code(statusCode).send({ error });

export const obterCadastroArtesao = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!request.usuario) {
    return respostaErro(reply, 401, "Não autenticado");
  }

  try {
    const cadastro = await ArtesaoModel.buscarPorUsuario(request.usuario.id);
    if (!cadastro) return reply.send({ cadastro: null, subconta: null });

    const subconta = await consultarSubcontaArtesao(cadastro.subcontaId);
    return reply.send({ cadastro: cadastro.dados, subconta });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao consultar cadastro de artesão");
    return respostaErro(
      reply,
      503,
      "Não foi possível consultar a configuração financeira na AbacatePay.",
    );
  }
};

export const obterConfiguracaoArtesao = async (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    return reply.send({
      devMode: validarConfiguracaoAbacatePay().devMode,
      comissaoPercentual: obterComissaoArtesao(),
    });
  } catch (error) {
    reply.log.error({ err: error }, "Configuração financeira do artesão inválida");
    return respostaErro(
      reply,
      503,
      "A configuração de recebimentos ainda não está completa.",
    );
  }
};

export const cadastrarArtesao = async (
  request: FastifyRequest<{ Body: CorpoCadastroArtesao }>,
  reply: FastifyReply,
) => {
  const usuarioAutenticado = request.usuario;
  if (!usuarioAutenticado) {
    return respostaErro(reply, 401, "Não autenticado");
  }

  try {
    const usuario = await UsuarioModel.buscarPorId(usuarioAutenticado.id);
    if (!usuario || usuario.papel !== "cliente") {
      return respostaErro(
        reply,
        403,
        "Somente contas de usuário podem iniciar o cadastro de artesão.",
      );
    }

    const {
      usarEmailDaConta,
      emailProfissional,
      confirmacaoEmailProfissional,
      aceitaTermos,
      dadosPessoais,
      trabalho,
      dadosFinanceiros,
    } = request.body ?? {};

    if (!dadosPessoais || !trabalho || !dadosFinanceiros) {
      return respostaErro(reply, 400, "Preencha todas as etapas do cadastro.");
    }

    const nomeCompleto = comoTexto(dadosPessoais.nomeCompleto);
    const tipoPessoa = comoTexto(dadosPessoais.tipoPessoa);
    const documento = comoTexto(dadosPessoais.documento).replace(/\D/g, "");
    const telefone = comoTexto(dadosPessoais.telefone);
    const endereco = dadosPessoais.endereco ?? {};
    const cep = comoTexto(endereco.cep);
    const logradouro = comoTexto(endereco.logradouro);
    const numero = comoTexto(endereco.numero);
    const bairro = comoTexto(endereco.bairro);
    const cidade = comoTexto(endereco.cidade);
    const estado = comoTexto(endereco.estado).toUpperCase();
    const emailConta = usuario.email.trim().toLowerCase();
    const emailContato = usarEmailDaConta
      ? emailConta
      : comoTexto(emailProfissional).toLowerCase();
    const emailConfirmacao =
      comoTexto(confirmacaoEmailProfissional).toLowerCase();

    if (
      nomeCompleto.length < 3 ||
      !["fisica", "juridica"].includes(tipoPessoa) ||
      !validarDocumento(documento, tipoPessoa) ||
      telefone.replace(/\D/g, "").length < 10 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContato) ||
      (!usarEmailDaConta && emailContato !== emailConfirmacao) ||
      cep.replace(/\D/g, "").length !== 8 ||
      !logradouro ||
      !numero ||
      !bairro ||
      !cidade ||
      !/^[A-Z]{2}$/.test(estado)
    ) {
      return respostaErro(reply, 400, "Revise os dados pessoais e de contato.");
    }

    const nomePublico = comoTexto(trabalho.nomePublico);
    const apresentacao = comoTexto(trabalho.apresentacao);
    const artesanato = comoTexto(trabalho.artesanato);
    const tecnicas = comoTexto(trabalho.tecnicas);
    const materiais = comoTexto(trabalho.materiais);
    const dadosRecebimento = validarDadosRecebimento(dadosFinanceiros);

    if (
      !nomePublico ||
      !apresentacao ||
      !artesanato ||
      !tecnicas ||
      !materiais ||
      !dadosRecebimento ||
      aceitaTermos !== true
    ) {
      return respostaErro(
        reply,
        400,
        "Revise a apresentação, os dados de recebimento e a confirmação dos termos.",
      );
    }

    const dados: DadosCadastroArtesaoLocal = {
      dadosPessoais: {
        nomeCompleto,
        tipoPessoa: tipoPessoa as "fisica" | "juridica",
        documento,
        telefone,
        emailProfissional: emailContato,
        endereco: {
          cep,
          logradouro,
          numero,
          complemento: comoTexto(endereco.complemento),
          bairro,
          cidade,
          estado,
        },
      },
      trabalho: {
        nomePublico,
        apresentacao,
        artesanato,
        tecnicas,
        materiais,
      },
      dadosFinanceiros: dadosRecebimento,
      termosVersao: "artesao-cadastro-v1",
    };

    await ArtesaoPerfilModel.concluirCadastro(usuario.id, dados);

    return reply.code(201).send({
      message: "Cadastro concluído e dados de recebimento armazenados.",
    });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao cadastrar artesão");
    const mensagem =
      error instanceof Error ? error.message : "Erro ao cadastrar artesão";
    if (mensagem.includes("ARTESAO_DADOS_ENCRYPTION_KEY")) {
      return respostaErro(
        reply,
        503,
        "O armazenamento protegido do cadastro ainda não está configurado.",
      );
    }
    return respostaErro(
      reply,
      500,
      "Não foi possível salvar o cadastro do artesão.",
    );
  }
};
