
import {
    and,
    asc,
    desc,
    eq,
    ne,
    or,
    sql,
} from "drizzle-orm";

import { db } from "../database/db.js";
import { conversas, mensagens, user } from "../database/schema.js";

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
        const consulta = db
            .select({
                id: conversas.id,
                clienteId: conversas.clienteId,
                artesaoId: conversas.artesaoId,
                assunto: conversas.assunto,
                criadoEm: conversas.criadoEm,
                atualizadoEm: conversas.atualizadoEm,

                clienteNome: sql<string>`(
                    SELECT \`name\`
                    FROM \`user\`
                    WHERE \`user\`.\`id\` = \`conversas\`.\`cliente_id\`
                )`,

                artesaoNome: sql<string>`(
                    SELECT \`name\`
                    FROM \`user\`
                    WHERE \`user\`.\`id\` = \`conversas\`.\`artesao_id\`
                )`,

                ultimaMensagem: sql<string | null>`(
                    SELECT m.conteudo
                    FROM mensagens m
                    WHERE m.conversa_id = conversas.id
                    ORDER BY m.enviado_em DESC, m.id DESC
                    LIMIT 1
                )`,

                ultimaMensagemEm: sql<Date | null>`(
                    SELECT m.enviado_em
                    FROM mensagens m
                    WHERE m.conversa_id = conversas.id
                    ORDER BY m.enviado_em DESC, m.id DESC
                    LIMIT 1
                )`,

                mensagensNaoLidas: sql<number>`(
                    SELECT COUNT(*)
                    FROM mensagens
                    WHERE mensagens.conversa_id = conversas.id
                        AND mensagens.remetente_id != ${usuarioId}
                        AND mensagens.lida = false
                )`,

            })
            .from(conversas)
            .where(
                or(
                    eq(conversas.clienteId, usuarioId),
                    eq(conversas.artesaoId, usuarioId),
                ),
            )
            .orderBy(desc(conversas.atualizadoEm));

        const resultado = await consulta;
        return resultado;
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
