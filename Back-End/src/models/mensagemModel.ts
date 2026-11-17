
import {
    and,
    asc,
    desc,
    eq,
    ne,
    or,
} from "drizzle-orm";

import { db } from "../database/db.js";
import { conversas, mensagens } from "../database/schema.js";

const MensagemModel = {
    // Busca uma conversa existente entre cliente e artesão
    buscarConversa: async (clienteId: string, artesaoId: string) => {
        const resultado = await db
            .select()
            .from(conversas)
            .where(
                and(
                    eq(conversas.clienteId, clienteId),
                    eq(conversas.artesaoId, artesaoId),
                ),
            );

        return resultado[0] ?? null;
    },

    // Cria uma nova conversa
    criarConversa: async (
        clienteId: string,
        artesaoId: string,
        assunto?: string,
    ) => {
        const agora = new Date();

        await db.insert(conversas).values({
            clienteId,
            artesaoId,
            assunto: assunto ?? null,
            criadoEm: agora,
            atualizadoEm: agora,
        });

        return await MensagemModel.buscarConversa(clienteId, artesaoId);
    },

    // Lista conversas das quais o usuário participa
    listarConversas: async (usuarioId: string) => {
        return await db
            .select()
            .from(conversas)
            .where(
                or(
                    eq(conversas.clienteId, usuarioId),
                    eq(conversas.artesaoId, usuarioId),
                ),
            )
            .orderBy(desc(conversas.atualizadoEm));
    },

    // Busca uma conversa pelo ID
    buscarConversaPorId: async (conversaId: number) => {
        const resultado = await db
            .select()
            .from(conversas)
            .where(eq(conversas.id, conversaId));

        return resultado[0] ?? null;
    },

    // Lista mensagens de uma conversa
    listarMensagens: async (conversaId: number) => {
        return await db
            .select()
            .from(mensagens)
            .where(eq(mensagens.conversaId, conversaId))
            .orderBy(asc(mensagens.enviadoEm));
    },

    // Adiciona uma mensagem
    adicionarMensagem: async (
        conversaId: number,
        remetenteId: string,
        conteudo: string,
    ) => {
        const agora = new Date();

        await db.insert(mensagens).values({
            conversaId,
            remetenteId,
            conteudo,
            enviadoEm: agora,
            lida: false,
        });

        await db
            .update(conversas)
            .set({ atualizadoEm: agora })
            .where(eq(conversas.id, conversaId));
    },

    // Marca como lidas as mensagens enviadas pelo outro participante
    marcarComoLidas: async (
        conversaId: number,
        usuarioId: string,
    ) => {
        await db
            .update(mensagens)
            .set({ lida: true })
            .where(
                and(
                    eq(mensagens.conversaId, conversaId),
                    ne(mensagens.remetenteId, usuarioId),
                    eq(mensagens.lida, false),
                ),
            );
    },
};

export default MensagemModel;
