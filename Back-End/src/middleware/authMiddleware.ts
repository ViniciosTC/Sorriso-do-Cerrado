import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth/better-auth.js";
import UsuarioModel from "../models/usuarioModel.js";

export const ehAdministrador = (papel?: string) =>
  papel === "admin" || papel === "super_admin";

export const autenticar: preHandlerHookHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.code(401).send({
        error: "O tempo da sua sessão acabou ou você não está logado. Por favor, faça login novamente.",
      });
    }

    const usuario = await UsuarioModel.buscarPorId(session.user.id);
    if (!usuario || !usuario.isActive || usuario.deletedAt) {
      return reply.code(401).send({ error: "Conta desativada" });
    }

    request.usuario = {
      id: session.user.id,
      email: usuario.email,
      papel: usuario.papel || "cliente",
    };
  } catch (error) {
    request.log.error({ err: error }, "Falha ao validar sessão");
    return reply.code(401).send({
      error: "O tempo da sua sessão acabou. Por favor, faça login novamente.",
    });
  }
};

export const autorizar = (...papeis: string[]): preHandlerHookHandler => {
  const papeisNormalizados = papeis.map((papel) => papel.trim().toLowerCase());

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.usuario) {
      return reply.code(401).send({ error: "Não autenticado" });
    }

    const papelUsuario = request.usuario.papel?.trim().toLowerCase();
    const autorizado =
      (papelUsuario && papeisNormalizados.includes(papelUsuario)) ||
      (papeisNormalizados.includes("admin") && papelUsuario === "super_admin");
    if (!autorizado) {
      return reply.code(403).send({ error: "Acesso negado" });
    }
  };
};
