import type { FastifyPluginAsync } from "fastify";
import {
  listarUsuarios,
  listarClientesVendedores,
  listarAdministradores,
  obterIndicadoresAdministrativos,
  cadastrarAdministrador,
  atualizarAdministrador,
  atualizarStatusAdministrador,
  excluirAdministrador,
  atualizarUsuario,
  atualizarMeuUsuario,
  deletarUsuario,
} from "../controllers/usuarioController.js";
import {
  cadastrarArtesao,
  obterConfiguracaoArtesao,
  obterCadastroArtesao,
  obterMeuPerfilArtesao,
  atualizarMeuPerfilArtesao,
  listarArtesaosPublicos,
  obterLojaArtesaoPublica,
} from "../controllers/artesaoController.js";
import {
  atualizarDadosRecebimentoArtesao,
  listarSaquesArtesao,
  obterDadosRecebimentoArtesao,
  obterSaldoArtesao,
  solicitarSaqueArtesao,
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

  app.get("/artesaos", listarArtesaosPublicos);
  app.get<{ Params: { id: string } }>(
    "/artesaos/:id",
    obterLojaArtesaoPublica,
  );
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
  app.get("/artesao/saldo", { preHandler: [autenticar] }, obterSaldoArtesao);
  app.get("/artesao/saques", { preHandler: [autenticar] }, listarSaquesArtesao);
  app.post<{ Body: { valor?: unknown } }>(
    "/artesao/saques",
    { preHandler: [autenticar] },
    solicitarSaqueArtesao,
  );
  app.get(
    "/artesao/perfil",
    { preHandler: [autenticar] },
    obterMeuPerfilArtesao,
  );
  app.put<{ Body: Parameters<typeof atualizarMeuPerfilArtesao>[0]["body"] }>(
    "/artesao/perfil",
    { preHandler: [autenticar] },
    atualizarMeuPerfilArtesao,
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
  app.get(
    "/indicadores",
    { preHandler: [autenticar, autorizar("admin")] },
    obterIndicadoresAdministrativos,
  );
  app.get(
    "/clientes-vendedores",
    { preHandler: [autenticar, autorizar("admin")] },
    listarClientesVendedores,
  );
  app.get(
    "/administradores",
    { preHandler: [autenticar, autorizar("admin")] },
    listarAdministradores,
  );
  app.post<{ Body: { nome: string; email: string; senha: string } }>(
    "/administradores",
    { preHandler: [autenticar, autorizar("super_admin")] },
    cadastrarAdministrador,
  );
  app.patch<{
    Params: { id: string };
    Body: { email?: string; senha?: string };
  }>(
    "/administradores/:id",
    { preHandler: [autenticar, autorizar("super_admin")] },
    atualizarAdministrador,
  );
  app.patch<{ Params: { id: string }; Body: { ativo: boolean } }>(
    "/administradores/:id/estado",
    { preHandler: [autenticar, autorizar("super_admin")] },
    atualizarStatusAdministrador,
  );
  app.delete<{ Params: { id: string } }>(
    "/administradores/:id",
    { preHandler: [autenticar, autorizar("super_admin")] },
    excluirAdministrador,
  );

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

  app.delete<{ Params: { id: string }; Body: { confirmacao: boolean } }>(
    "/:id",
    { preHandler: [autenticar, autorizar("super_admin")] },
    deletarUsuario,
  );
};

export default usuariosRoutes;
