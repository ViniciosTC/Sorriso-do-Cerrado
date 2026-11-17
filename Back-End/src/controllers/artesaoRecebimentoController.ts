import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { garantirSubconta } from "../services/subcontaArtesaoService.js";
import SaqueModel, { type NovoSaque } from "../models/saqueModel.js";
import {
  consultarSubcontaArtesao,
  sacarSubconta,
  splitHabilitado,
} from "../services/abacatePayService.js";
import ArtesaoPerfilModel, {
  type DadosRecebimento,
} from "../models/artesaoPerfilModel.js";
import { validarDadosRecebimento } from "./artesaoController.js";

type CorpoDadosRecebimento = {
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

const papeisArtesao = ["artisan", "artesa", "vendedor"];

const SAQUE_MINIMO_EM_REAIS = 3.5;

const emReais = (centavos: number) => centavos / 100;

const autorizarArtesao = (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!request.usuario) {
    reply.code(401).send({ error: "Não autenticado" });
    return false;
  }
  if (!papeisArtesao.includes(request.usuario.papel ?? "")) {
    reply.code(403).send({ error: "Apenas artesãos podem acessar estes dados" });
    return false;
  }
  return true;
};

export const obterDadosRecebimentoArtesao = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!autorizarArtesao(request, reply) || !request.usuario) return;

  try {
    const perfil = await ArtesaoPerfilModel.buscarPorUsuario(request.usuario.id);
    if (!perfil) {
      return reply.code(404).send({ error: "Cadastro de artesão não encontrado" });
    }
    return reply.send({ dadosFinanceiros: perfil.dadosFinanceiros });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao consultar dados de recebimento");
    return reply.code(500).send({ error: "Não foi possível consultar os dados" });
  }
};

export const atualizarDadosRecebimentoArtesao = async (
  request: FastifyRequest<{ Body: CorpoDadosRecebimento }>,
  reply: FastifyReply,
) => {
  if (!autorizarArtesao(request, reply) || !request.usuario) return;

  const dadosFinanceiros: DadosRecebimento | null =
    validarDadosRecebimento(request.body);
  if (!dadosFinanceiros) {
    return reply.code(400).send({ error: "Revise os dados de recebimento" });
  }

  try {
    const dadosAtualizados = await ArtesaoPerfilModel.atualizarDadosRecebimento(
      request.usuario.id,
      dadosFinanceiros,
    );
    if (!dadosAtualizados) {
      return reply.code(404).send({ error: "Cadastro de artesão não encontrado" });
    }
    return reply.send({ dadosFinanceiros: dadosAtualizados });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao atualizar dados de recebimento");
    return reply.code(500).send({ error: "Não foi possível salvar os dados" });
  }
};

export const obterSaldoArtesao = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!autorizarArtesao(request, reply) || !request.usuario) return;

  if (!splitHabilitado()) {
    return reply.send({
      repasseAutomatico: false,
      disponivel: 0,
      bloqueado: 0,
      saqueMinimo: SAQUE_MINIMO_EM_REAIS,
    });
  }

  try {
    const cadastro = await garantirSubconta(request.usuario.id);

    const { balance } = await consultarSubcontaArtesao(cadastro.subcontaId);
    return reply.send({
      repasseAutomatico: true,
      disponivel: emReais(balance.available),
      bloqueado: emReais(balance.blocked),
      saqueMinimo: SAQUE_MINIMO_EM_REAIS,
    });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao consultar saldo do artesão");
    return reply.code(502).send({ error: "Não foi possível consultar o saldo agora" });
  }
};

export const solicitarSaqueArtesao = async (
  request: FastifyRequest<{ Body: { valor?: unknown } }>,
  reply: FastifyReply,
) => {
  if (!autorizarArtesao(request, reply) || !request.usuario) return;

  if (!splitHabilitado()) {
    return reply.code(503).send({
      error: "O repasse automático está indisponível no momento.",
    });
  }

  const valor = Number(request.body?.valor);
  if (!Number.isFinite(valor) || valor < SAQUE_MINIMO_EM_REAIS) {
    return reply.code(400).send({
      error: `O valor mínimo para saque é R$ ${SAQUE_MINIMO_EM_REAIS.toFixed(2).replace(".", ",")}`,
    });
  }
  const valorEmCentavos = Math.round(valor * 100);

  try {
    const cadastro = await garantirSubconta(request.usuario.id);

    const { balance } = await consultarSubcontaArtesao(cadastro.subcontaId);
    if (valorEmCentavos > balance.available) {
      return reply.code(400).send({ error: "Saldo disponível insuficiente" });
    }

    const id = randomUUID();
    const transferencia = await sacarSubconta(cadastro.subcontaId, valorEmCentavos, id);
    const saque: NovoSaque = {
      id,
      usuarioId: request.usuario.id,
      valor: emReais(transferencia.amount),
      taxa: emReais(transferencia.platformFee),
      status: transferencia.status === "COMPLETE" ? "concluido" : "falhou",
      transferenciaId: transferencia.id,
    };
    await SaqueModel.criar(saque);

    return reply.code(201).send({
      id: saque.id,
      valor: saque.valor,
      taxa: saque.taxa,
      status: saque.status,
    });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao solicitar saque do artesão");
    return reply.code(502).send({ error: "Não foi possível realizar o saque agora" });
  }
};

export const listarSaquesArtesao = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!autorizarArtesao(request, reply) || !request.usuario) return;

  try {
    return reply.send(await SaqueModel.listarPorUsuario(request.usuario.id));
  } catch (error) {
    request.log.error({ err: error }, "Erro ao listar saques do artesão");
    return reply.code(500).send({ error: "Não foi possível consultar os saques" });
  }
};
