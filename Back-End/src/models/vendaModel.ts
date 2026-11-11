import { eq } from "drizzle-orm";
import { db } from "../database/db.js";
import { vendas } from "../database/schema.js";

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
};

export default VendaModel;
