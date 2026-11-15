import type { FastifyReply, FastifyRequest } from "fastify";
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
