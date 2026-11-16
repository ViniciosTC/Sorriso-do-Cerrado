import { desc, eq } from "drizzle-orm";
import { db } from "../database/db.js";
import { eventosAbacatePay, vendas } from "../database/schema.js";

export interface Venda {
  id?: number;
  nomeCliente: string;
  emailCliente?: string | null;
  telefoneCliente?: string | null;
  total?: number | string | null;
  status?: "pendente" | "confirmada" | "cancelada" | null;
  pagamentoId?: string | null;
}

const VendaModel = {
  listarTodas: async (): Promise<Venda[]> => {
    return await db.select().from(vendas);
  },

  listarRecentesPorEmail: async (email: string) => {
    return await db
      .select({
        id: vendas.id,
        data: vendas.data,
        total: vendas.total,
        status: vendas.status,
      })
      .from(vendas)
      .where(eq(vendas.emailCliente, email))
      .orderBy(desc(vendas.data))
      .limit(3);
  },

  buscarPorId: async (id: string | number): Promise<Venda | null> => {
    const resultado = await db
      .select()
      .from(vendas)
      .where(eq(vendas.id, Number(id)));

    return resultado[0] ?? null;
  },

  criar: async (venda: Venda): Promise<Venda> => {
    const resultado = await db.insert(vendas).values({
      nomeCliente: venda.nomeCliente,
      emailCliente: venda.emailCliente,
      telefoneCliente: venda.telefoneCliente,
      total: venda.total != null ? String(venda.total) : undefined,
      status: venda.status ?? "pendente",
      pagamentoId: venda.pagamentoId,
    });

    return {
      id: Number(resultado[0].insertId),
      ...venda,
    };
  },

  atualizarStatus: async (
    id: string | number,
    status: NonNullable<Venda["status"]>,
  ): Promise<void> => {
    await db.update(vendas).set({ status }).where(eq(vendas.id, Number(id)));
  },

  atualizarStatusPorPagamento: async (
    pagamentoId: string,
    status: NonNullable<Venda["status"]>,
  ): Promise<void> => {
    await db
      .update(vendas)
      .set({ status })
      .where(eq(vendas.pagamentoId, pagamentoId));
  },

  registrarEventoAbacatePay: async (
    eventoId: string,
    evento: string,
    pagamentoId: string | null,
    status: NonNullable<Venda["status"]> | null,
  ): Promise<"registrado" | "duplicado" | "sem_venda"> => {
    return db.transaction(async (transacao) => {
      if (pagamentoId && status) {
        const vendaExistente = await transacao
          .select({ id: vendas.id })
          .from(vendas)
          .where(eq(vendas.pagamentoId, pagamentoId));
        if (vendaExistente.length === 0) return "sem_venda";
      }

      const eventoExistente = await transacao
        .select({ id: eventosAbacatePay.id })
        .from(eventosAbacatePay)
        .where(eq(eventosAbacatePay.id, eventoId));
      if (eventoExistente.length > 0) return "duplicado";

      try {
        await transacao.insert(eventosAbacatePay).values({
          id: eventoId,
          evento,
          criadoEm: new Date(),
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "ER_DUP_ENTRY"
        ) {
          return "duplicado";
        }
        throw error;
      }

      if (pagamentoId && status) {
        await transacao
          .update(vendas)
          .set({ status })
          .where(eq(vendas.pagamentoId, pagamentoId));
      }

      return "registrado";
    });
  },
};

export default VendaModel;
