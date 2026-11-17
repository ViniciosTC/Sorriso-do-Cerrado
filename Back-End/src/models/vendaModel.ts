import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../database/db.js";
import {
  eventosAbacatePay,
  itensVenda,
  produtos,
  vendas,
} from "../database/schema.js";

export interface Venda {
  id?: number;
  nomeCliente: string;
  emailCliente?: string | null;
  telefoneCliente?: string | null;
  total?: number | string | null;
  status?: "pendente" | "confirmada" | "cancelada" | null;
  pagamentoId?: string | null;
}

export interface ItemVendaNovo {
  idProduto: number;
  idArtesao: string | null;
  quantidade: number;
  precoUnitario: number;
  valorRepasse: number;
}

export interface PedidoArtesao {
  codigo: string;
  data: Date | null;
  status: "confirmada" | "cancelada";
  cliente: string;
  email: string | null;
  telefone: string | null;
  itens: { nome: string; quantidade: number; valor: number }[];
  total: number;
  repasse: number;
}

const arredondar = (valor: number) => Math.round(valor * 100) / 100;

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

  listarPorArtesao: async (artesaoId: string): Promise<PedidoArtesao[]> => {
    const linhas = await db
      .select({
        vendaId: vendas.id,
        data: vendas.data,
        status: vendas.status,
        cliente: vendas.nomeCliente,
        email: vendas.emailCliente,
        telefone: vendas.telefoneCliente,
        nomeProduto: produtos.nome,
        quantidade: itensVenda.quantidade,
        precoUnitario: itensVenda.precoUnitario,
        repasse: itensVenda.valorRepasse,
      })
      .from(itensVenda)
      .innerJoin(vendas, eq(itensVenda.idVenda, vendas.id))
      .innerJoin(produtos, eq(itensVenda.idProduto, produtos.id))
      .where(
        and(
          eq(itensVenda.artesaoId, artesaoId),
          inArray(vendas.status, ["confirmada", "cancelada"]),
        ),
      )
      .orderBy(desc(vendas.data), desc(vendas.id));

    const pedidos = new Map<number, PedidoArtesao>();
    for (const linha of linhas) {
      const pedido = pedidos.get(linha.vendaId) ?? {
        codigo: String(linha.vendaId),
        data: linha.data,
        status: linha.status === "cancelada" ? "cancelada" : "confirmada",
        cliente: linha.cliente,
        email: linha.email,
        telefone: linha.telefone,
        itens: [],
        total: 0,
        repasse: 0,
      };
      const valor = Number(linha.precoUnitario);

      pedido.itens.push({
        nome: linha.nomeProduto,
        quantidade: linha.quantidade,
        valor,
      });
      pedido.total = arredondar(pedido.total + valor * linha.quantidade);
      pedido.repasse = arredondar(pedido.repasse + Number(linha.repasse));
      pedidos.set(linha.vendaId, pedido);
    }

    return [...pedidos.values()];
  },

  criar: async (venda: Venda, itens: ItemVendaNovo[] = []): Promise<Venda> => {
    return db.transaction(async (transacao) => {
      const resultado = await transacao.insert(vendas).values({
        nomeCliente: venda.nomeCliente,
        emailCliente: venda.emailCliente,
        telefoneCliente: venda.telefoneCliente,
        data: new Date(),
        total: venda.total != null ? String(venda.total) : undefined,
        status: venda.status ?? "pendente",
        pagamentoId: venda.pagamentoId,
      });
      const id = Number(resultado[0].insertId);

      if (itens.length > 0) {
        await transacao.insert(itensVenda).values(
          itens.map((item) => ({
            idVenda: id,
            idProduto: item.idProduto,
            artesaoId: item.idArtesao,
            quantidade: item.quantidade,
            precoUnitario: String(item.precoUnitario),
            valorRepasse: String(item.valorRepasse),
          })),
        );
      }

      return { id, ...venda };
    });
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
