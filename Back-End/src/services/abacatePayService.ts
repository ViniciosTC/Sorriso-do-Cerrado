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
  devMode: boolean;
};

export type SubcontaAbacatePay = {
  id: string;
  name: string;
  taxId: string;
  externalId: string | null;
  balance: {
    available: number;
    blocked: number;
  };
  devMode: boolean;
};

export type SplitPagamento = {
  subAccountId: string;
  amount: number;
};

const STATUS_VENDA_POR_STATUS_PIX: Record<string, StatusVenda> = {
  PAID: "confirmada",
  EXPIRED: "cancelada",
  CANCELLED: "cancelada",
};

const obterConfiguracao = () => {
  const modo = process.env.ABACATEPAY_MODE ?? "test";
  if (modo !== "test" && modo !== "production") {
    throw new Error("ABACATEPAY_MODE deve ser 'test' ou 'production'");
  }

  const apiKey =
    modo === "production"
      ? process.env.ABACATEPAY_API_KEY_PROD
      : process.env.ABACATEPAY_API_KEY_DEV ?? process.env.ABACATEPAY_API_KEY;
  const prefixo = modo === "production" ? "abc_prod_" : "abc_dev_";

  if (!apiKey || !apiKey.startsWith(prefixo)) {
    throw new Error(
      `Configure uma chave AbacatePay ${modo === "test" ? "abc_dev_" : "abc_prod_"} compatível com ABACATEPAY_MODE`,
    );
  }

  return { apiKey, devMode: modo === "test" };
};

export const validarConfiguracaoAbacatePay = () => obterConfiguracao();

export const obterModoAbacatePay = (): "test" | "production" => {
  const modo = process.env.ABACATEPAY_MODE ?? "test";
  if (modo !== "test" && modo !== "production") {
    throw new Error("ABACATEPAY_MODE deve ser 'test' ou 'production'");
  }
  return modo;
};

export const obterComissaoArtesao = () => {
  const modo = obterModoAbacatePay();
  const configurada =
    modo === "test"
      ? process.env.ABACATEPAY_COMMISSION_TEST ?? "10"
      : process.env.ABACATEPAY_COMMISSION_PROD;

  if (configurada === undefined || configurada.trim() === "") {
    throw new Error(
      "Configure ABACATEPAY_COMMISSION_PROD antes de habilitar repasses em produção",
    );
  }

  const percentual = Number(configurada);
  if (!Number.isFinite(percentual) || percentual < 0 || percentual >= 100) {
    throw new Error("A comissão deve estar entre 0 e 100 por cento");
  }

  return percentual;
};

const requisitar = async <T>(
  caminho: string,
  init?: RequestInit,
  exigirModo?: "test" | "production",
): Promise<T> => {
  const { apiKey, devMode } = obterConfiguracao();
  if (exigirModo && (exigirModo === "test") !== devMode) {
    throw new Error(`Esta operação só está disponível no modo ${exigirModo}`);
  }

  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const corpo = (await resposta.json()) as RespostaAbacatePay<T>;

  if (!resposta.ok || !corpo.success) {
    throw new Error(`AbacatePay: ${corpo.error ?? resposta.statusText}`);
  }

  return corpo.data;
};

export const criarCobrancaPix = (
  valorEmReais: number,
  descricao: string,
  splits: SplitPagamento[] = [],
) =>
  requisitar<CobrancaPix>("/transparents/create", {
    method: "POST",
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: Math.round(valorEmReais * 100),
        description: descricao,
        expiresIn: VALIDADE_PIX_EM_SEGUNDOS,
        ...(splits.length > 0 ? { splits } : {}),
      },
    }),
  });

export const consultarStatusVenda = async (pagamentoId: string): Promise<StatusVenda> => {
  const { status } = await requisitar<Pick<CobrancaPix, "status">>(
    `/transparents/check?id=${encodeURIComponent(pagamentoId)}`,
  );

  return STATUS_VENDA_POR_STATUS_PIX[status] ?? "pendente";
};

export const criarSubcontaArtesao = (
  nome: string,
  taxId: string,
  externalId: string,
) =>
  requisitar<SubcontaAbacatePay>("/sub-accounts/create", {
    method: "POST",
    body: JSON.stringify({ name: nome, taxId, externalId }),
  });

export const consultarSubcontaArtesao = (id: string) =>
  requisitar<SubcontaAbacatePay>(
    `/sub-accounts/get?id=${encodeURIComponent(id)}`,
  );

export const simularPagamentoPix = (pagamentoId: string) =>
  requisitar<CobrancaPix>(
    `/transparents/simulate-payment?id=${encodeURIComponent(pagamentoId)}`,
    { method: "POST" },
    "test",
  );
