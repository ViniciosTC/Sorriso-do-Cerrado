import type { Venda } from "../models/vendaModel.js";

const URL_BASE = "https://api.abacatepay.com/v2";
const VALIDADE_PIX_EM_SEGUNDOS = 15 * 60;

type StatusVenda = NonNullable<Venda["status"]>;

type RespostaAbacatePay<T> = {
  success: boolean;
  error: string | null;
  data: T;
};

export type CobrancaPix = {
  id: string;
  brCode: string;
  brCodeBase64: string;
  status: string;
  expiresAt: string;
};

const STATUS_VENDA_POR_STATUS_PIX: Record<string, StatusVenda> = {
  PAID: "confirmada",
  EXPIRED: "cancelada",
  CANCELLED: "cancelada",
};

const requisitar = async <T>(caminho: string, init?: RequestInit): Promise<T> => {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    },
  });
  const corpo = (await resposta.json()) as RespostaAbacatePay<T>;

  if (!resposta.ok || !corpo.success) {
    throw new Error(`AbacatePay: ${corpo.error ?? resposta.statusText}`);
  }

  return corpo.data;
};

export const criarCobrancaPix = (valorEmReais: number, descricao: string) =>
  requisitar<CobrancaPix>("/transparents/create", {
    method: "POST",
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: Math.round(valorEmReais * 100),
        description: descricao,
        expiresIn: VALIDADE_PIX_EM_SEGUNDOS,
      },
    }),
  });

export const consultarStatusVenda = async (pagamentoId: string): Promise<StatusVenda> => {
  const { status } = await requisitar<Pick<CobrancaPix, "status">>(
    `/transparents/check?id=${encodeURIComponent(pagamentoId)}`,
  );

  return STATUS_VENDA_POR_STATUS_PIX[status] ?? "pendente";
};
