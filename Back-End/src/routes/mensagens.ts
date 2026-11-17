
import type { FastifyPluginAsync } from "fastify";

import { autenticar } from "../middleware/authMiddleware.js";

import {
  criarConversa,
  listarConversas,
  listarMensagens,
  enviarMensagem,
  marcarMensagensComoLidas,
} from "../controllers/mensagemController.js";

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

const mensagensRoutes: FastifyPluginAsync = async (app) => {
  // Criar conversa
  app.post<{ Body: CriarConversaBody }>(
    "/conversas",
    { preHandler: [autenticar] },
    criarConversa,
  );

  // Listar conversas do usuário
  app.get(
    "/conversas",
    { preHandler: [autenticar] },
    listarConversas,
  );

  // Listar mensagens de uma conversa
  app.get<{ Params: ConversaParams }>(
    "/conversas/:id",
    { preHandler: [autenticar] },
    listarMensagens,
  );

  // Enviar mensagem
  app.post<{
    Params: ConversaParams;
    Body: EnviarMensagemBody;
  }>(
    "/conversas/:id",
    { preHandler: [autenticar] },
    enviarMensagem,
  );

  // Marcar mensagens como lidas
  app.patch<{ Params: ConversaParams }>(
    "/conversas/:id/lidas",
    { preHandler: [autenticar] },
    marcarMensagensComoLidas,
  );
};

export default mensagensRoutes;
