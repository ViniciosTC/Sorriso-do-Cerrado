import type { FastifyPluginAsync } from "fastify";
import {
  ORDENS_ARTESAO,
  listarArtesaos,
  obterArtesao,
  type FiltrosArtesao,
} from "../controllers/artesaoPublicoController.js";
import { propriedadesBusca } from "../schemas/filtrosBusca.js";

const esquemaFiltros = {
  querystring: {
    type: "object",
    properties: {
      ...propriedadesBusca,
      ordem: { type: "string", enum: ORDENS_ARTESAO },
    },
  },
};

const artesaosRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: FiltrosArtesao }>(
    "/",
    { schema: esquemaFiltros },
    listarArtesaos,
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string", maxLength: 36 } },
        },
      },
    },
    obterArtesao,
  );
};

export default artesaosRoutes;
