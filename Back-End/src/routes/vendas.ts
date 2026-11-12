import type { FastifyPluginAsync } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { autenticar, autorizar } from "../middleware/authMiddleware.js";
import ProdutoModel from "../models/produtoModel.js";
import VendaModel from "../models/vendaModel.js";
import {
  consultarStatusVenda,
  criarCobrancaPix,
} from "../services/abacatePayService.js";

type ItemVenda = { id: number; quantidade: number };

type CreateSaleBody = {
  nomeCliente: string;
  telefoneCliente?: string;
  itens: ItemVenda[];
};

type SaleParams = { id: string };

const DESCRICAO_COBRANCA = "Pedido Sorriso do Cerrado";

const calcularTotal = async (itens: ItemVenda[]): Promise<number | null> => {
  if (!Array.isArray(itens) || itens.length === 0) return null;

  let total = 0;
  for (const { id, quantidade } of itens) {
    const produto = await ProdutoModel.buscarPorId(id);
    if (!produto || !Number.isInteger(quantidade) || quantidade < 1) return null;
    total += Number(produto.preco) * quantidade;
  }
  return total;
};

const vendasRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/",
    { preHandler: [autenticar, autorizar("admin")] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        return reply.send(await VendaModel.listarTodas());
      } catch (error) {
        reply.log.error({ err: error }, "Erro ao buscar vendas");
        return reply.code(500).send({ error: "Erro ao buscar vendas" });
      }
    },
  );

  app.post<{ Body: CreateSaleBody }>(
    "/",
    { preHandler: [autenticar] },
    async (request, reply) => {
      try {
        if (!request.usuario) {
          return reply.code(401).send({ error: "Não autenticado" });
        }

        const { nomeCliente, telefoneCliente, itens } = request.body;
        const total = await calcularTotal(itens);
        if (total === null) {
          return reply.code(400).send({ error: "Itens do pedido inválidos" });
        }

        const { id: pagamentoId, ...pix } = await criarCobrancaPix(
          total,
          DESCRICAO_COBRANCA,
        );
        const venda = await VendaModel.criar({
          nomeCliente,
          emailCliente: request.usuario.email,
          telefoneCliente,
          total,
          pagamentoId,
        });

        return reply.code(201).send({ id: venda.id, total, pix });
      } catch (error) {
        request.log.error({ err: error }, "Erro ao registrar venda");
        return reply.code(500).send({ error: "Erro ao registrar venda" });
      }
    },
  );

  app.get<{ Params: SaleParams }>(
    "/:id/pagamento",
    { preHandler: [autenticar] },
    async (request, reply) => {
      try {
        const venda = await VendaModel.buscarPorId(request.params.id);
        if (!venda) {
          return reply.code(404).send({ error: "Venda não encontrada" });
        }
        if (venda.emailCliente !== request.usuario?.email) {
          return reply.code(403).send({ error: "Acesso negado" });
        }
        if (venda.status !== "pendente" || !venda.pagamentoId) {
          return reply.send({ status: venda.status });
        }

        const status = await consultarStatusVenda(venda.pagamentoId);
        if (status !== "pendente") {
          await VendaModel.atualizarStatus(request.params.id, status);
        }
        return reply.send({ status });
      } catch (error) {
        request.log.error({ err: error }, "Erro ao consultar pagamento");
        return reply.code(500).send({ error: "Erro ao consultar pagamento" });
      }
    },
  );
};

export default vendasRoutes;
