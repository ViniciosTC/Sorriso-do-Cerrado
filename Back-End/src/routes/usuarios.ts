import type { FastifyPluginAsync } from "fastify";
import {
  listarUsuarios,
  atualizarUsuario,
  atualizarMeuUsuario,
  deletarUsuario,
} from "../controllers/usuarioController.js";
import {
  cadastrarArtesao,
  obterConfiguracaoArtesao,
  obterCadastroArtesao,
} from "../controllers/artesaoController.js";
import {
  atualizarDadosRecebimentoArtesao,
  obterDadosRecebimentoArtesao,
} from "../controllers/artesaoRecebimentoController.js";
import { autenticar, autorizar } from "../middleware/authMiddleware.js";

const usuariosRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (_request, reply) => {
    return reply.code(410).send({
      error: "Use o endpoint oficial do Better Auth em /api/auth/sign-up/email para criar uma conta.",
    });
  });

  app.post("/login", async (_request, reply) => {
    return reply.code(410).send({
      error: "Utilize o endpoint oficial do Better Auth em /api/auth/sign-in/email para efetuar login.",
    });
  });

  app.get(
    "/artesao/configuracao",
    { preHandler: [autenticar] },
    obterConfiguracaoArtesao,
  );
  app.get(
    "/artesao/recebimentos",
    { preHandler: [autenticar] },
    obterDadosRecebimentoArtesao,
  );
  app.put<{ Body: Parameters<typeof atualizarDadosRecebimentoArtesao>[0]["body"] }>(
    "/artesao/recebimentos",
    { preHandler: [autenticar] },
    atualizarDadosRecebimentoArtesao,
  );
  app.get("/artesao", { preHandler: [autenticar] }, obterCadastroArtesao);
  app.post<{ Body: Parameters<typeof cadastrarArtesao>[0]["body"] }>(
    "/artesao",
    { preHandler: [autenticar] },
    cadastrarArtesao,
  );

  app.post("/virar-vendedor", async (_request, reply) => {
    return reply.code(410).send({
      error: "Use o processo de cadastro profissional em /usuarios/artesao.",
    });
  });

  app.get("/", { preHandler: [autenticar, autorizar("admin")] }, listarUsuarios);

  app.put<{ Body: { nome?: string; email?: string } }>(
    "/me",
    { preHandler: [autenticar] },
    atualizarMeuUsuario,
  );

  app.put<{ Params: { id: string }; Body: { nome?: string; email?: string } }>(
    "/:id",
    { preHandler: [autenticar] },
    atualizarUsuario,
  );

  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [autenticar, autorizar("admin")] },
    deletarUsuario,
  );
};

export default usuariosRoutes;
