import { eq } from "drizzle-orm";
import { db } from "../database/db.js";
import { produtos } from "../database/schema.js";

export interface Produto {
  id?: number;
  usuarioId?: string | null;
  nome: string;
  descricao?: string | null;
  preco: number | string;
  estoque: number | null;
  imagemURL?: string | null;
  categoria?: string | null;
}

const ProdutoModel = {
  listarTodos: async (): Promise<Produto[]> => {
    return await db.select().from(produtos);
  },

  listarParaGerenciamento: async (usuarioId: string, isAdmin: boolean) => {
    if (isAdmin) return db.select().from(produtos);
    return db.select().from(produtos).where(eq(produtos.usuarioId, usuarioId));
  },

  buscarPorId: async (id: string | number): Promise<Produto | null> => {
    const resultado = await db
      .select()
      .from(produtos)
      .where(eq(produtos.id, Number(id)));

    return resultado[0] ?? null;
  },

  criar: async (produto: Produto): Promise<Produto> => {
    const {
      usuarioId,
      nome,
      descricao,
      preco,
      estoque,
      imagemURL,
      categoria,
    } = produto;

    const resultado = await db.insert(produtos).values({
      usuarioId,
      nome,
      descricao,
      preco: String(preco),
      estoque,
      imagemURL,
      categoria,
    });

    return {
      id: Number(resultado[0].insertId),
      ...produto,
    };
  },

  atualizar: async (
    id: string | number,
    produto: Produto
  ): Promise<boolean> => {
    const { nome, descricao, preco, estoque, imagemURL, categoria } = produto;

    const resultado = await db
      .update(produtos)
      .set({
        nome,
        descricao,
        preco: String(preco),
        estoque,
        imagemURL,
        categoria,
      })
      .where(eq(produtos.id, Number(id)));

    return resultado[0].affectedRows > 0;
  },

  deletar: async (id: string | number): Promise<boolean> => {
    const resultado = await db
      .delete(produtos)
      .where(eq(produtos.id, Number(id)));

    return resultado[0].affectedRows > 0;
  },
};

export default ProdutoModel;