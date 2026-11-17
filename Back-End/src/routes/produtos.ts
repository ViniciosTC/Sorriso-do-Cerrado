import type { FastifyPluginAsync } from "fastify";
import { propriedadesBusca } from "../schemas/filtrosBusca.js";
import {
  listarProdutos,
  listarProdutosParaGerenciamento,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  deletarProduto,
} from "../controllers/produtoController.js";
import { autenticar, autorizar } from "../middleware/authMiddleware.js";
import {
  ORDENS_PRODUTO,
  type FiltrosProduto,
  type Produto,
} from "../models/produtoModel.js";

const esquemaFiltros = {
  querystring: {
    type: "object",
    properties: {
      ...propriedadesBusca,
      artesaoId: { type: "string", maxLength: 36 },
      ordem: { type: "string", enum: ORDENS_PRODUTO },
    },
  },
};

const produtosRoutes: FastifyPluginAsync = async (app) => {
  type ProductParams = { id: string };
  type ProductBody = Omit<Produto, "id">;

  app.get<{ Querystring: FiltrosProduto }>(
    "/",
    { schema: esquemaFiltros },
    listarProdutos,
  );
  app.get(
    "/meus",
    {
      preHandler: [
        autenticar,
        autorizar("admin", "artisan", "vendedor", "artesa"),
      ],
    },
    listarProdutosParaGerenciamento,
  );
  app.get<{ Params: ProductParams }>("/:id", buscarProdutoPorId);
  app.post<{ Body: ProductBody }>(
    "/",
    {
      preHandler: [
        autenticar,
        autorizar("admin", "artisan", "vendedor", "artesa"),
      ],
    },
    criarProduto,
  );
  app.put<{ Params: ProductParams; Body: ProductBody }>(
    "/:id",
    {
      preHandler: [
        autenticar,
        autorizar("admin", "artisan", "vendedor", "artesa"),
      ],
    },
    atualizarProduto,
  );
  app.delete<{ Params: ProductParams }>(
    "/:id",
    {
      preHandler: [
        autenticar,
        autorizar("admin", "artisan", "vendedor", "artesa"),
      ],
    },
    deletarProduto,
  );
};

export default produtosRoutes;
