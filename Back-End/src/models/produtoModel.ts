import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  like,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "../database/db.js";
import { produtos, user } from "../database/schema.js";

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

export const ORDENS_PRODUTO = [
  "recentes",
  "antigos",
  "maior_preco",
  "menor_preco",
] as const;

export type OrdemProduto = (typeof ORDENS_PRODUTO)[number];

export interface FiltrosProduto {
  busca?: string;
  categoria?: string[];
  precoMin?: number;
  precoMax?: number;
  artesaoId?: string;
  ordem?: OrdemProduto;
}

const ORDENACOES: Record<OrdemProduto, SQL[]> = {
  recentes: [desc(produtos.criadoEm), desc(produtos.id)],
  antigos: [asc(produtos.criadoEm), asc(produtos.id)],
  maior_preco: [desc(produtos.preco), desc(produtos.id)],
  menor_preco: [asc(produtos.preco), asc(produtos.id)],
};

const montarCondicoes = (filtros: FiltrosProduto) => {
  const { categoria, precoMin, precoMax, artesaoId } = filtros;
  const termo = filtros.busca?.trim();
  const contem = `%${termo}%`;

  return and(
    termo
      ? or(
          like(produtos.nome, contem),
          like(produtos.categoria, contem),
          like(user.name, contem),
        )
      : undefined,
    categoria?.length ? inArray(produtos.categoria, categoria) : undefined,
    precoMin !== undefined ? gte(produtos.preco, String(precoMin)) : undefined,
    precoMax !== undefined ? lte(produtos.preco, String(precoMax)) : undefined,
    artesaoId ? eq(produtos.usuarioId, artesaoId) : undefined,
  );
};

const ProdutoModel = {
  idsDeArtesaosComProduto: async (filtros: FiltrosProduto): Promise<Set<string>> => {
    const linhas = await db
      .selectDistinct({ id: produtos.usuarioId })
      .from(produtos)
      .where(montarCondicoes(filtros));

    return new Set(linhas.flatMap(({ id }) => (id ? [id] : [])));
  },

  buscar: async (filtros: FiltrosProduto = {}) => {
    return await db
      .select({ ...getTableColumns(produtos), artesao: user.name })
      .from(produtos)
      .leftJoin(user, eq(produtos.usuarioId, user.id))
      .where(montarCondicoes(filtros))
      .orderBy(...ORDENACOES[filtros.ordem ?? "recentes"]);
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