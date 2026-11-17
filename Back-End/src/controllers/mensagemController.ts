
import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";

import MensagemModel from "../models/mensagemModel.js";
import { db } from "../database/db.js";
import { user } from "../database/schema.js";

type CriarConversaBody = {
    artesaoId?: string;
    assunto?: string;
};

type EnviarMensagemBody = {
    conteudo?: string;
};

type ConversaParams = {
    id: string;
};

const papeisArtesao = ["artisan", "artesa", "vendedor"];

const autorizarUsuario = (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    if (!request.usuario) {
        reply.code(401).send({ error: "Não autenticado" });
        return false;
    }

    return true;
};

const buscarConversaAutorizada = async (
    conversaId: number,
    usuarioId: string,
) => {
    const conversa = await MensagemModel.buscarConversaPorId(conversaId);

    if (
        !conversa ||
        (conversa.clienteId !== usuarioId &&
            conversa.artesaoId !== usuarioId)
    ) {
        return null;
    }

    return conversa;
};

// POST /mensagens/conversas
export const criarConversa = async (
    request: FastifyRequest<{ Body: CriarConversaBody }>,
    reply: FastifyReply,
) => {
    if (!autorizarUsuario(request, reply) || !request.usuario) return;

    try {
        const { artesaoId, assunto } = request.body ?? {};

        if (!artesaoId || typeof artesaoId !== "string") {
            return reply.code(400).send({
                error: "Informe o artesão",
            });
        }

        if (assunto !== undefined && (
            typeof assunto !== "string" || assunto.length > 150
        )) {
            return reply.code(400).send({
                error: "O assunto deve ter no máximo 150 caracteres",
            });
        }

        const [artesao] = await db
            .select({
                id: user.id,
                papel: user.papel,
                isActive: user.isActive,
            })
            .from(user)
            .where(eq(user.id, artesaoId));

        if (
            !artesao ||
            !artesao.isActive ||
            !papeisArtesao.includes(artesao.papel ?? "")
        ) {
            return reply.code(404).send({
                error: "Artesão não encontrado",
            });
        }

        if (artesaoId === request.usuario.id) {
            return reply.code(400).send({
                error: "Você não pode iniciar uma conversa consigo mesmo",
            });
        }

        let conversa = await MensagemModel.buscarConversa(
            request.usuario.id,
            artesaoId,
        );

        if (!conversa) {
            try {
                conversa = await MensagemModel.criarConversa(
                    request.usuario.id,
                    artesaoId,
                    assunto?.trim(),
                );
            } catch (erroCriacao: unknown) {
                const codigoErro =
                    typeof erroCriacao === "object" &&
                    erroCriacao !== null &&
                    "code" in erroCriacao
                        ? String((erroCriacao as { code?: unknown }).code)
                        : "";

                if (codigoErro !== "ER_DUP_ENTRY") {
                    throw erroCriacao;
                }

                conversa = await MensagemModel.buscarConversa(
                    request.usuario.id,
                    artesaoId,
                );
            }
        }

        return reply.code(200).send(conversa);
    } catch (error) {
        request.log.error({ err: error }, "Erro ao criar conversa");

        return reply.code(500).send({
            error: "Não foi possível iniciar a conversa",
        });
    }
};

// GET /mensagens/conversas
export const listarConversas = async (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    if (!autorizarUsuario(request, reply) || !request.usuario) return;

    try {
        const conversas = await MensagemModel.listarConversas(
            request.usuario.id,
        );

        return reply.send(conversas);
    } catch (error) {
        request.log.error({ err: error }, "Erro ao listar conversas");

        return reply.code(500).send({
            error: "Não foi possível listar as conversas",
        });
    }
};

// GET /mensagens/conversas/:id
export const listarMensagens = async (
    request: FastifyRequest<{ Params: ConversaParams }>,
    reply: FastifyReply,
) => {
    if (!autorizarUsuario(request, reply) || !request.usuario) return;

    const conversaId = Number(request.params.id);

    if (!Number.isSafeInteger(conversaId) || conversaId <= 0) {
        return reply.code(400).send({
            error: "Identificador de conversa inválido",
        });
    }

    try {
        const conversa = await buscarConversaAutorizada(
            conversaId,
            request.usuario.id,
        );

        if (!conversa) {
            return reply.code(404).send({
                error: "Conversa não encontrada",
            });
        }

        const mensagens = await MensagemModel.listarMensagens(conversaId);

        return reply.send({
            conversa,
            mensagens,
        });
    } catch (error) {
        request.log.error({ err: error }, "Erro ao buscar mensagens");

        return reply.code(500).send({
            error: "Não foi possível buscar as mensagens",
        });
    }
};

// POST /mensagens/conversas/:id
export const enviarMensagem = async (
    request: FastifyRequest<{
        Params: ConversaParams;
        Body: EnviarMensagemBody;
    }>,
    reply: FastifyReply,
) => {
    if (!autorizarUsuario(request, reply) || !request.usuario) return;

    const conversaId = Number(request.params.id);

    if (!Number.isSafeInteger(conversaId) || conversaId <= 0) {
        return reply.code(400).send({
            error: "Identificador de conversa inválido",
        });
    }

    const conteudo = request.body?.conteudo;

    if (
        typeof conteudo !== "string" ||
        !conteudo.trim() ||
        conteudo.trim().length > 5000
    ) {
        return reply.code(400).send({
            error: "A mensagem deve ter entre 1 e 5000 caracteres",
        });
    }

    try {
        const conversa = await buscarConversaAutorizada(
            conversaId,
            request.usuario.id,
        );

        if (!conversa) {
            return reply.code(404).send({
                error: "Conversa não encontrada",
            });
        }

        await MensagemModel.adicionarMensagem(
            conversaId,
            request.usuario.id,
            conteudo.trim(),
        );

        return reply.code(201).send({
            message: "Mensagem enviada com sucesso",
        });
    } catch (error) {
        request.log.error({ err: error }, "Erro ao enviar mensagem");

        return reply.code(500).send({
            error: "Não foi possível enviar a mensagem",
        });
    }
};

// PATCH /mensagens/conversas/:id/lidas
export const marcarMensagensComoLidas = async (
    request: FastifyRequest<{ Params: ConversaParams }>,
    reply: FastifyReply,
) => {
    if (!autorizarUsuario(request, reply) || !request.usuario) return;

    const conversaId = Number(request.params.id);

    if (!Number.isSafeInteger(conversaId) || conversaId <= 0) {
        return reply.code(400).send({
            error: "Identificador de conversa inválido",
        });
    }

    try {
        const conversa = await buscarConversaAutorizada(
            conversaId,
            request.usuario.id,
        );

        if (!conversa) {
            return reply.code(404).send({
                error: "Conversa não encontrada",
            });
        }

        await MensagemModel.marcarComoLidas(
            conversaId,
            request.usuario.id,
        );

        return reply.send({
            message: "Mensagens marcadas como lidas",
        });
    } catch (error) {
        request.log.error({ err: error }, "Erro ao marcar mensagens como lidas");

        return reply.code(500).send({
            error: "Não foi possível atualizar as mensagens",
        });
    }
};
