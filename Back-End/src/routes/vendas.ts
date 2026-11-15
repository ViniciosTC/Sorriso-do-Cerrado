import type { FastifyPluginAsync } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { autenticar, autorizar } from "../middleware/authMiddleware.js";
import ProdutoModel from "../models/produtoModel.js";
import VendaModel from "../models/vendaModel.js";
import ArtesaoModel from "../models/artesaoModel.js";
import {
  consultarStatusVenda,
  criarCobrancaPix,
  obterComissaoArtesao,
  obterModoAbacatePay,
  simularPagamentoPix,
  type SplitPagamento,
} from "../services/abacatePayService.js";

type ItemVenda = { id: number; quantidade: number };

type CreateSaleBody = {
  nomeCliente: string;
  telefoneCliente?: string;
  itens: ItemVenda[];
};

type SaleParams = { id: string };

const DESCRICAO_COBRANCA = "Pedido Sorriso do Cerrado";
const calcularTotal = async (
  itens: ItemVenda[],
): Promise<{ total: number; splits: SplitPagamento[] } | null> => {
  if (!Array.isArray(itens) || itens.length === 0) return null;

  let totalCentavos = 0;
  const subtotaisPorArtesao = new Map<string, number>();
  for (const { id, quantidade } of itens) {
    const produto = await ProdutoModel.buscarPorId(id);
    if (!produto || !Number.isInteger(quantidade) || quantidade < 1) return null;
    const subtotalCentavos = Math.round(Number(produto.preco) * 100) * quantidade;
    totalCentavos += subtotalCentavos;

    if (produto.usuarioId) {
      subtotaisPorArtesao.set(
        produto.usuarioId,
        (subtotaisPorArtesao.get(produto.usuarioId) ?? 0) + subtotalCentavos,
      );
    }
  }

  const splits: SplitPagamento[] = [];
  for (const [artesaoId, subtotalCentavos] of subtotaisPorArtesao) {
    const subconta =
      await ArtesaoModel.buscarSubcontaPorUsuario(artesaoId);
    if (!subconta) {
      throw new Error("Produto de artesão sem subconta financeira vinculada");
    }

    if (subconta.devMode !== (obterModoAbacatePay() === "test")) {
      throw new Error(
        "A subconta do artesão pertence a outro ambiente da AbacatePay",
      );
    }

    const comissaoPlataforma = obterComissaoArtesao();
    const repasseCentavos = Math.floor(
      (subtotalCentavos * (100 - comissaoPlataforma)) / 100,
    );
    if (repasseCentavos > 0) {
      splits.push({
        subAccountId: subconta.subcontaId,
        amount: repasseCentavos,
      });
    }
  }

  return { total: totalCentavos / 100, splits };
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

  app.get(
    "/me",
    { preHandler: [autenticar] },
    async (request, reply) => {
      try {
        if (!request.usuario) {
          return reply.code(401).send({ error: "Não autenticado" });
        }

        return reply.send(
          await VendaModel.listarRecentesPorEmail(request.usuario.email),
        );
      } catch (error) {
        request.log.error({ err: error }, "Erro ao buscar pedidos do usuário");
        return reply.code(500).send({ error: "Erro ao buscar pedidos" });
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
        const calculo = await calcularTotal(itens);
        if (calculo === null) {
          return reply.code(400).send({ error: "Itens do pedido inválidos" });
        }

        const { id: pagamentoId, ...pix } = await criarCobrancaPix(
          calculo.total,
          DESCRICAO_COBRANCA,
          calculo.splits,
        );
        if (pix.devMode !== (obterModoAbacatePay() === "test")) {
          request.log.error(
            { pagamentoId, devMode: pix.devMode },
            "Modo da cobrança AbacatePay diferente do configurado",
          );
          return reply.code(502).send({
            error: "A cobrança foi criada em um ambiente diferente do configurado.",
          });
        }
        const venda = await VendaModel.criar({
          nomeCliente,
          emailCliente: request.usuario.email,
          telefoneCliente,
          total: calculo.total,
          pagamentoId,
        });

        return reply.code(201).send({ id: venda.id, total: calculo.total, pix });
      } catch (error) {
        request.log.error({ err: error }, "Erro ao registrar venda");
        const mensagem =
          error instanceof Error ? error.message : "Erro ao registrar venda";
        if (
          mensagem.includes("subconta financeira") ||
          mensagem.includes("outro ambiente")
        ) {
          return reply.code(409).send({ error: mensagem });
        }
        return reply.code(502).send({
          error: "Não foi possível registrar a cobrança na AbacatePay.",
        });
      }
    },
  );

  app.post<{ Params: SaleParams }>(
    "/:id/simular-pagamento",
    { preHandler: [autenticar] },
    async (request, reply) => {
      try {
        const venda = await VendaModel.buscarPorId(request.params.id);
        if (!venda) {
          return reply.code(404).send({ error: "Venda não encontrada" });
        }
        if (
          venda.emailCliente !== request.usuario?.email &&
          request.usuario?.papel !== "admin"
        ) {
          return reply.code(403).send({ error: "Acesso negado" });
        }
        if (obterModoAbacatePay() !== "test") {
          return reply.code(403).send({
            error: "A simulação só funciona com uma chave AbacatePay de teste.",
          });
        }
        if (!venda.pagamentoId) {
          return reply.code(400).send({ error: "Cobrança não encontrada" });
        }

        return reply.send(await simularPagamentoPix(venda.pagamentoId));
      } catch (error) {
        request.log.error({ err: error }, "Erro ao simular pagamento Pix");
        return reply.code(502).send({
          error: "Não foi possível simular o pagamento na AbacatePay.",
        });
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
