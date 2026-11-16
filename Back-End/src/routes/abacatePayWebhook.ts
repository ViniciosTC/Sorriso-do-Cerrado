import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";
import VendaModel from "../models/vendaModel.js";
import { obterModoAbacatePay } from "../services/abacatePayService.js";

const CHAVE_ASSINATURA_ABACATEPAY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

type PayloadWebhook = {
  id?: unknown;
  event?: unknown;
  apiVersion?: unknown;
  devMode?: unknown;
  data?: {
    transparent?: {
      id?: unknown;
      status?: unknown;
    };
  };
};

const compararSeguramente = (recebido: string, esperado: string) => {
  const bufferRecebido = Buffer.from(recebido);
  const bufferEsperado = Buffer.from(esperado);
  return (
    bufferRecebido.length === bufferEsperado.length &&
    timingSafeEqual(bufferRecebido, bufferEsperado)
  );
};

const eventoDePagamento = (payload: PayloadWebhook) => {
  const evento = typeof payload.event === "string" ? payload.event : "";
  const transparente = payload.data?.transparent;
  const pagamentoId =
    typeof transparente?.id === "string" ? transparente.id : null;
  const statusPagamento =
    typeof transparente?.status === "string" ? transparente.status : "";

  if (
    evento === "transparent.completed" &&
    ["PAID", "APPROVED"].includes(statusPagamento)
  ) {
    return { pagamentoId, status: "confirmada" as const };
  }

  if (
    ["transparent.refunded", "transparent.lost"].includes(evento) ||
    (evento === "transparent.disputed" && statusPagamento === "REFUNDED")
  ) {
    return { pagamentoId, status: "cancelada" as const };
  }

  return { pagamentoId: null, status: null };
};

const abacatePayWebhook: FastifyPluginAsync = async (app) => {
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (request, body, done) => {
      const rawBody = Buffer.isBuffer(body) ? body : Buffer.from(body);
      request.rawBody = rawBody;
      try {
        done(null, JSON.parse(rawBody.toString("utf8")));
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  );

  app.post("/", async (request, reply) => {
    const segredoConfigurado = process.env.ABACATEPAY_WEBHOOK_SECRET;
    if (!segredoConfigurado || segredoConfigurado.length < 32) {
      return reply.code(503).send({ error: "Webhook não configurado" });
    }

    const segredoRecebido = request.headers["x-webhook-secret"];
    const assinatura = request.headers["x-webhook-signature"];
    if (
      typeof segredoRecebido !== "string" ||
      typeof assinatura !== "string" ||
      !request.rawBody ||
      !compararSeguramente(segredoRecebido, segredoConfigurado)
    ) {
      return reply.code(401).send({ error: "Webhook não autorizado" });
    }

    const assinaturaEsperada = createHmac(
      "sha256",
      CHAVE_ASSINATURA_ABACATEPAY,
    )
      .update(request.rawBody)
      .digest("base64");
    if (!compararSeguramente(assinatura, assinaturaEsperada)) {
      return reply.code(401).send({ error: "Assinatura inválida" });
    }

    const payload = request.body as PayloadWebhook;
    if (
      typeof payload.id !== "string" ||
      payload.id.length > 100 ||
      typeof payload.event !== "string" ||
      payload.apiVersion !== 2 ||
      typeof payload.devMode !== "boolean"
    ) {
      return reply.code(400).send({ error: "Envelope de webhook inválido" });
    }

    if (payload.devMode !== (obterModoAbacatePay() === "test")) {
      return reply.code(401).send({ error: "Ambiente do webhook incompatível" });
    }

    const { pagamentoId, status } = eventoDePagamento(payload);
    try {
      const resultado = await VendaModel.registrarEventoAbacatePay(
        payload.id,
        payload.event,
        pagamentoId,
        status,
      );
      return reply.send({
        recebido: true,
        duplicado: resultado === "duplicado",
      });
    } catch (error) {
      request.log.error({ err: error }, "Erro ao processar webhook AbacatePay");
      return reply.code(500).send({ error: "Falha ao processar webhook" });
    }
  });
};

export default abacatePayWebhook;
