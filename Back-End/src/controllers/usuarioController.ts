import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { hashPassword } from "better-auth/crypto";
import { and, eq, isNull } from "drizzle-orm";
import UsuarioModel from "../models/usuarioModel.js";
import { db } from "../database/db.js";
import { account, adminAuditLogs, session, user } from "../database/schema.js";
import { ehAdministrador } from "../middleware/authMiddleware.js";

type UserParams = { id: string };
type UpdateUserBody = { nome?: string; email?: string };
type CreateAdminBody = { nome: string; email: string; senha: string };
type UpdateAdminBody = { email?: string; senha?: string };
type AdminStatusBody = { ativo: boolean };
type DeleteUserBody = { confirmacao: boolean };

export const listarUsuarios = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    return reply.send(await UsuarioModel.listarUsuariosAtivos());
  } catch (error) {
    reply.log.error({ err: error }, "Erro ao listar usuários");
    return reply.code(500).send({ error: "Erro ao listar usuários" });
  }
};

export const listarClientesVendedores = async (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    return reply.send(await UsuarioModel.listarClientesVendedores());
  } catch (error) {
    reply.log.error({ err: error }, "Erro ao listar clientes e artesãos");
    return reply.code(500).send({ error: "Erro ao listar clientes e artesãos" });
  }
};

export const obterIndicadoresAdministrativos = async (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    return reply.send(await UsuarioModel.contarIndicadoresAdministrativos());
  } catch (error) {
    reply.log.error({ err: error }, "Erro ao consultar indicadores administrativos");
    return reply.code(500).send({ error: "Erro ao consultar indicadores" });
  }
};

export const listarAdministradores = async (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    return reply.send(await UsuarioModel.listarAdministradores());
  } catch (error) {
    reply.log.error({ err: error }, "Erro ao listar administradores");
    return reply.code(500).send({ error: "Erro ao listar administradores" });
  }
};

export const cadastrarAdministrador = async (
  request: FastifyRequest<{ Body: CreateAdminBody }>,
  reply: FastifyReply,
) => {
  const nome =
    typeof request.body?.nome === "string" ? request.body.nome.trim() : "";
  const email =
    typeof request.body?.email === "string"
      ? request.body.email.trim().toLowerCase()
      : "";
  const senha =
    typeof request.body?.senha === "string" ? request.body.senha : "";

  if (!nome || !email || !senha || nome.length > 255 || email.length > 255) {
    return reply.code(400).send({ error: "Nome, e-mail e senha são obrigatórios" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || senha.length < 8) {
    return reply.code(400).send({
      error: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres",
    });
  }
  if (!request.usuario) {
    return reply.code(401).send({ error: "Não autenticado" });
  }

  try {
    const userId = randomUUID();
    const agora = new Date();
    const senhaHash = await hashPassword(senha);

    await db.transaction(async (transacao) => {
      await transacao.insert(user).values({
        id: userId,
        name: nome,
        email,
        papel: "admin",
        emailVerified: true,
        isActive: true,
        createdAt: agora,
        updatedAt: agora,
      });
      await transacao.insert(account).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: senhaHash,
        createdAt: agora,
        updatedAt: agora,
      });
      await transacao.insert(adminAuditLogs).values({
        id: randomUUID(),
        actorId: request.usuario!.id,
        targetUserId: userId,
        action: "admin_created",
        details: JSON.stringify({ email }),
        createdAt: agora,
      });
    });

    return reply.code(201).send({
      id: userId,
      nome,
      email,
      papel: "admin",
      ativo: true,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return reply.code(409).send({ error: "Já existe uma conta com este e-mail" });
    }
    request.log.error({ err: error }, "Erro ao cadastrar administrador");
    return reply.code(500).send({ error: "Erro ao cadastrar administrador" });
  }
};

export const atualizarAdministrador = async (
  request: FastifyRequest<{ Params: UserParams; Body: UpdateAdminBody }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const emailInformado = request.body?.email !== undefined;
  const email =
    typeof request.body?.email === "string"
      ? request.body.email.trim().toLowerCase()
      : "";
  const senha = typeof request.body?.senha === "string" ? request.body.senha : "";

  if (!id || (!emailInformado && !senha)) {
    return reply.code(400).send({ error: "Informe um novo e-mail ou senha" });
  }
  if (emailInformado && (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return reply.code(400).send({ error: "Informe um e-mail válido" });
  }
  if (senha && senha.length < 8) {
    return reply.code(400).send({
      error: "A senha deve ter pelo menos 8 caracteres",
    });
  }
  if (request.usuario?.papel !== "super_admin") {
    return reply.code(403).send({ error: "Apenas o Super Admin pode editar administradores" });
  }
  if (id === request.usuario.id) {
    return reply.code(403).send({ error: "Não é permitido editar a própria conta por esta operação" });
  }

  try {
    const senhaHash = senha ? await hashPassword(senha) : null;
    const resultado = await db.transaction(async (transacao) => {
      const encontrados = await transacao
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1)
        .for("update");
      const alvo = encontrados[0];

      if (!alvo || alvo.deletedAt) return "not_found" as const;
      if (alvo.papel !== "admin") return "protected" as const;

      const emailAlterado = emailInformado && email !== alvo.email;
      if (!emailAlterado && !senhaHash) return "unchanged" as const;

      if (emailAlterado) {
        await transacao
          .update(user)
          .set({ email, updatedAt: new Date() })
          .where(eq(user.id, id));
      }

      if (senhaHash) {
        const contas = await transacao
          .select({ id: account.id })
          .from(account)
          .where(and(eq(account.userId, id), eq(account.providerId, "credential")))
          .limit(1)
          .for("update");
        const agora = new Date();

        if (contas[0]) {
          await transacao
            .update(account)
            .set({ password: senhaHash, updatedAt: agora })
            .where(eq(account.id, contas[0].id));
        } else {
          await transacao.insert(account).values({
            id: randomUUID(),
            userId: id,
            accountId: id,
            providerId: "credential",
            password: senhaHash,
            createdAt: agora,
            updatedAt: agora,
          });
        }
      }

      const agora = new Date();
      await transacao.delete(session).where(eq(session.userId, id));
      await transacao.insert(adminAuditLogs).values({
        id: randomUUID(),
        actorId: request.usuario!.id,
        targetUserId: id,
        action: "admin_updated",
        details: JSON.stringify({
          emailAlterado,
          senhaAlterada: Boolean(senhaHash),
        }),
        createdAt: agora,
      });
      return "updated" as const;
    });

    if (resultado === "not_found") {
      return reply.code(404).send({ error: "Administrador não encontrado" });
    }
    if (resultado === "protected") {
      return reply.code(403).send({ error: "A conta Super Admin não pode ser editada" });
    }
    if (resultado === "unchanged") {
      return reply.send({ message: "Nenhuma alteração foi necessária" });
    }
    return reply.send({ message: "Administrador atualizado com sucesso" });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return reply.code(409).send({ error: "Já existe uma conta com este e-mail" });
    }
    request.log.error({ err: error }, "Erro ao atualizar administrador");
    return reply.code(500).send({ error: "Erro ao atualizar administrador" });
  }
};

export const atualizarStatusAdministrador = async (
  request: FastifyRequest<{ Params: UserParams; Body: AdminStatusBody }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const ativo = request.body?.ativo;

  if (typeof ativo !== "boolean") {
    return reply.code(400).send({ error: "Informe o estado ativo como booleano" });
  }
  if (!request.usuario) {
    return reply.code(401).send({ error: "Não autenticado" });
  }
  if (id === request.usuario.id) {
    return reply.code(403).send({ error: "Não é permitido alterar o próprio acesso" });
  }

  try {
    const resultado = await db.transaction(async (transacao) => {
      const encontrados = await transacao
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1)
        .for("update");
      const alvo = encontrados[0];

      if (!alvo || alvo.deletedAt) return "not_found" as const;
      if (alvo.papel !== "admin") return "protected" as const;
      if (alvo.isActive === ativo) return "unchanged" as const;

      const agora = new Date();
      await transacao
        .update(user)
        .set({ isActive: ativo, updatedAt: agora })
        .where(eq(user.id, id));

      if (!ativo) {
        await transacao.delete(session).where(eq(session.userId, id));
      }

      await transacao.insert(adminAuditLogs).values({
        id: randomUUID(),
        actorId: request.usuario!.id,
        targetUserId: id,
        action: ativo ? "admin_reactivated" : "admin_deactivated",
        details: JSON.stringify({ ativo }),
        createdAt: agora,
      });
      return "updated" as const;
    });

    if (resultado === "not_found") {
      return reply.code(404).send({ error: "Administrador não encontrado" });
    }
    if (resultado === "protected") {
      return reply.code(403).send({
        error: "Somente administradores comuns podem ser desativados ou reativados",
      });
    }
    if (resultado === "unchanged") {
      return reply.code(409).send({ error: "A conta já está nesse estado" });
    }
    return reply.send({
      message: ativo
        ? "Administrador reativado com sucesso"
        : "Administrador desativado com sucesso",
    });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao alterar estado do administrador");
    return reply.code(500).send({ error: "Erro ao alterar estado do administrador" });
  }
};

export const excluirAdministrador = async (
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  if (!id) {
    return reply.code(400).send({ error: "ID do administrador é obrigatório" });
  }
  if (!request.usuario) {
    return reply.code(401).send({ error: "Não autenticado" });
  }
  if (id === request.usuario.id) {
    return reply.code(403).send({ error: "Não é permitido excluir a própria conta" });
  }

  try {
    const resultado = await db.transaction(async (transacao) => {
      const encontrados = await transacao
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1)
        .for("update");
      const alvo = encontrados[0];

      if (!alvo || alvo.deletedAt) return "not_found" as const;
      if (alvo.papel !== "admin") return "protected" as const;

      const agora = new Date();
      await transacao
        .update(user)
        .set({ isActive: false, deletedAt: agora, updatedAt: agora })
        .where(eq(user.id, id));
      await transacao.delete(session).where(eq(session.userId, id));
      await transacao.insert(adminAuditLogs).values({
        id: randomUUID(),
        actorId: request.usuario!.id,
        targetUserId: id,
        action: "admin_soft_deleted",
        details: JSON.stringify({ papel: alvo.papel }),
        createdAt: agora,
      });
      return "deleted" as const;
    });

    if (resultado === "not_found") {
      return reply.code(404).send({ error: "Administrador não encontrado" });
    }
    if (resultado === "protected") {
      return reply.code(403).send({ error: "A conta Super Admin não pode ser excluída" });
    }
    return reply.send({ message: "Administrador excluído com sucesso" });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao excluir administrador");
    return reply.code(500).send({ error: "Erro ao excluir administrador" });
  }
};

export const atualizarUsuario = async (
  request: FastifyRequest<{ Params: UserParams; Body: UpdateUserBody }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  if (!id) {
    return reply.code(400).send({ error: "ID do usuário é obrigatório" });
  }

  try {
    if (!request.usuario) {
      return reply.code(401).send({ error: "Não autenticado" });
    }

    const logado = await UsuarioModel.buscarPorId(request.usuario.id);
    const isOwner = request.usuario.id === id;
    const isAdmin = ehAdministrador(logado?.papel ?? undefined);

    if (!isOwner && !isAdmin) {
      return reply.code(403).send({ error: "Acesso negado" });
    }

    const alvo = await UsuarioModel.buscarPorId(id);
    if (!alvo) {
      return reply.code(404).send({ error: "Usuário não encontrado" });
    }
    if (alvo.papel === "super_admin" || (alvo.papel === "admin" && !isOwner)) {
      return reply.code(403).send({
        error: "Administradores devem ser editados pela operação administrativa autorizada",
      });
    }

    await db
      .update(user)
      .set({
        name: request.body.nome,
        email: request.body.email,
        updatedAt: new Date(),
      })
      .where(and(eq(user.id, id), eq(user.isActive, true), isNull(user.deletedAt)));

    return reply.send({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    reply.log.error({ err: error }, "Erro ao atualizar usuário");
    return reply.code(500).send({ error: "Erro ao atualizar usuário" });
  }
};

export const atualizarMeuUsuario = async (
  request: FastifyRequest<{ Body: UpdateUserBody }>,
  reply: FastifyReply,
) => {
  if (!request.usuario) {
    return reply.code(401).send({ error: "Não autenticado" });
  }

  try {
    await db
      .update(user)
      .set({
        name: request.body.nome,
        email: request.body.email,
        updatedAt: new Date(),
      })
      .where(and(eq(user.id, request.usuario.id), eq(user.isActive, true)));

    return reply.send({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao atualizar usuário");
    return reply.code(500).send({ error: "Erro ao atualizar usuário" });
  }
};

export const deletarUsuario = async (
  request: FastifyRequest<{
    Params: UserParams;
    Body: DeleteUserBody;
  }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  if (!id) {
    return reply.code(400).send({ error: "ID do usuário é obrigatório" });
  }
  if (request.body?.confirmacao !== true) {
    return reply.code(400).send({
      error: "Confirme explicitamente a exclusão da conta",
    });
  }
  if (!request.usuario) {
    return reply.code(401).send({ error: "Não autenticado" });
  }
  if (id === request.usuario.id) {
    return reply.code(403).send({ error: "Não é permitido excluir a própria conta" });
  }

  try {
    const resultado = await db.transaction(async (transacao) => {
      const encontrados = await transacao
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1)
        .for("update");
      const alvo = encontrados[0];

      if (!alvo || !alvo.isActive || alvo.deletedAt) return "not_found" as const;
      if (ehAdministrador(alvo.papel ?? undefined)) return "administrator" as const;

      const agora = new Date();
      await transacao
        .update(user)
        .set({ isActive: false, deletedAt: agora, updatedAt: agora })
        .where(eq(user.id, id));
      await transacao.delete(session).where(eq(session.userId, id));
      await transacao.insert(adminAuditLogs).values({
        id: randomUUID(),
        actorId: request.usuario!.id,
        targetUserId: id,
        action: "user_soft_deleted",
        details: JSON.stringify({ papel: alvo.papel }),
        createdAt: agora,
      });
      return "deleted" as const;
    });

    if (resultado === "not_found") {
      return reply.code(404).send({ error: "Usuário não encontrado" });
    }
    if (resultado === "administrator") {
      return reply.code(403).send({
        error: "Contas administrativas não podem ser excluídas por esta operação",
      });
    }
    return reply.send({ message: "Conta desativada com sucesso" });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao desativar usuário");
    return reply.code(500).send({ error: "Erro ao desativar usuário" });
  }
};
