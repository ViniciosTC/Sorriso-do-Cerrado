import type { FastifyPluginAsync } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { autenticar, autorizar, ehAdministrador } from "../middleware/authMiddleware.js";
import ProdutoModel from "../models/produtoModel.js";
import VendaModel, { type ItemVendaNovo } from "../models/vendaModel.js";
import { garantirSubconta } from "../services/subcontaArtesaoService.js";
import {
  consultarStatusVenda,
  criarCobrancaPix,
  obterComissaoArtesao,
  obterModoAbacatePay,
  splitHabilitado,
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

type ItemPedido = {
  idProduto: number;
  idArtesao: string | null;
  subcontaId: string | null;
  quantidade: number;
  precoEmCentavos: number;
  repasseEmCentavos: number;
};

type Pedido = {
  total: number;
  itens: ItemPedido[];
  splits: SplitPagamento[];
};

const buscarSubconta = async (artesaoId: string) => {
  const subconta = await garantirSubconta(artesaoId);
  if (subconta.devMode !== (obterModoAbacatePay() === "test")) {
    throw new Error("A subconta do artesão pertence a outro ambiente da AbacatePay");
  }
  return subconta.subcontaId;
};

const calcularRepasse = (subtotalEmCentavos: number) =>
  Math.floor((subtotalEmCentavos * (100 - obterComissaoArtesao())) / 100);

const agruparSplits = (itens: ItemPedido[]): SplitPagamento[] => {
  const repassePorSubconta = new Map<string, number>();
  for (const { subcontaId, repasseEmCentavos } of itens) {
    if (!subcontaId) continue;
    repassePorSubconta.set(
      subcontaId,
      (repassePorSubconta.get(subcontaId) ?? 0) + repasseEmCentavos,
    );
  }

  return [...repassePorSubconta]
    .filter(([, amount]) => amount > 0)
    .map(([subAccountId, amount]) => ({ subAccountId, amount }));
};

const montarPedido = async (itens: ItemVenda[]): Promise<Pedido | null> => {
  if (!Array.isArray(itens) || itens.length === 0) return null;

  const subcontas = new Map<string, string>();
  const itensPedido: ItemPedido[] = [];

  for (const { id, quantidade } of itens) {
    const produto = await ProdutoModel.buscarPorId(id);
    if (!produto || !Number.isInteger(quantidade) || quantidade < 1) return null;

    const idArtesao = produto.usuarioId ?? null;
    let subcontaId: string | null = null;
    if (idArtesao && splitHabilitado()) {
      subcontaId = subcontas.get(idArtesao) ?? (await buscarSubconta(idArtesao));
      subcontas.set(idArtesao, subcontaId);
    }

    const precoEmCentavos = Math.round(Number(produto.preco) * 100);
    itensPedido.push({
      idProduto: id,
      idArtesao,
      subcontaId,
      quantidade,
      precoEmCentavos,
      repasseEmCentavos: idArtesao
        ? calcularRepasse(precoEmCentavos * quantidade)
        : 0,
    });
  }

  const totalEmCentavos = itensPedido.reduce(
    (soma, item) => soma + item.precoEmCentavos * item.quantidade,
    0,
  );

  return {
    total: totalEmCentavos / 100,
    itens: itensPedido,
    splits: agruparSplits(itensPedido),
  };
};

const paraItensVenda = (itens: ItemPedido[]): ItemVendaNovo[] =>
  itens.map(
    ({ idProduto, idArtesao, quantidade, precoEmCentavos, repasseEmCentavos }) => ({
      idProduto,
      idArtesao,
      quantidade,
      precoUnitario: precoEmCentavos / 100,
      valorRepasse: repasseEmCentavos / 100,
    }),
  );

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

  app.get(
    "/artesao",
    { preHandler: [autenticar, autorizar("artisan", "artesa", "vendedor")] },
    async (request, reply) => {
      try {
        if (!request.usuario) {
          return reply.code(401).send({ error: "Não autenticado" });
        }

        return reply.send(await VendaModel.listarPorArtesao(request.usuario.id));
      } catch (error) {
        request.log.error({ err: error }, "Erro ao buscar pedidos do artesão");
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
        const pedido = await montarPedido(itens);
        if (pedido === null) {
          return reply.code(400).send({ error: "Itens do pedido inválidos" });
        }

        const { id: pagamentoId, ...pix } = await criarCobrancaPix(
          pedido.total,
          DESCRICAO_COBRANCA,
          pedido.splits,
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
        const venda = await VendaModel.criar(
          {
            nomeCliente,
            emailCliente: request.usuario.email,
            telefoneCliente,
            total: pedido.total,
            pagamentoId,
          },
          paraItensVenda(pedido.itens),
        );

        return reply.code(201).send({ id: venda.id, total: pedido.total, pix });
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
          !ehAdministrador(request.usuario?.papel)
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
