import { db } from './db.js';
import { user, account, adminAuditLogs } from './schema.js';
import { eq, inArray } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';

export const criarAdminPadrao = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL?.trim() || "admin@email.com").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    if (adminEmail) {
      const encontrados = await db
        .select()
        .from(user)
        .where(eq(user.email, adminEmail));
      const principal = encontrados[0];

      if (principal) {
        if (!["admin", "super_admin"].includes(principal.papel ?? "")) {
          throw new Error("ADMIN_EMAIL precisa identificar uma conta administrativa existente");
        }
        if (!principal.isActive || principal.deletedAt) {
          throw new Error("A conta administrativa indicada por ADMIN_EMAIL está desativada");
        }
        if (principal.papel === "admin") {
          const agora = new Date();
          await db.transaction(async (transacao) => {
            await transacao
              .update(user)
              .set({ papel: "super_admin", updatedAt: agora })
              .where(eq(user.id, principal.id));
            await transacao.insert(adminAuditLogs).values({
              id: randomUUID(),
              actorId: null,
              targetUserId: principal.id,
              action: "bootstrap_super_admin",
              details: JSON.stringify({ email: adminEmail }),
              createdAt: agora,
            });
          });
        }
        console.log(`Super Admin principal verificado: ${adminEmail}`);
        return;
      }

      if (!adminPassword) {
        throw new Error(
          "ADMIN_EMAIL não corresponde a uma conta existente; ADMIN_PASSWORD é necessário para criá-la",
        );
      }

      const userId = randomUUID();
      const agora = new Date();
      const senhaHash = await hashPassword(adminPassword);
      await db.transaction(async (transacao) => {
        await transacao.insert(user).values({
          id: userId,
          name: "Admin",
          email: adminEmail,
          papel: "super_admin",
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
          actorId: null,
          targetUserId: userId,
          action: "bootstrap_super_admin_created",
          details: JSON.stringify({ email: adminEmail }),
          createdAt: agora,
        });
      });
      console.log(`Super Admin inicial criado a partir de ADMIN_EMAIL: ${adminEmail}`);
      return;
    }

    const administradores = await db
      .select()
      .from(user)
      .where(inArray(user.papel, ["admin", "super_admin"]));
    if (administradores.some((administrador) => administrador.papel === "super_admin")) {
      return;
    }
    if (administradores.length !== 1 || !administradores[0].isActive) {
      throw new Error(
        "Defina ADMIN_EMAIL para identificar o Super Admin inicial; sem ele, deve existir exatamente um administrador ativo",
      );
    }

    const principal = administradores[0];
    const agora = new Date();
    await db.transaction(async (transacao) => {
      await transacao
        .update(user)
        .set({ papel: "super_admin", updatedAt: agora })
        .where(eq(user.id, principal.id));
      await transacao.insert(adminAuditLogs).values({
        id: randomUUID(),
        actorId: null,
        targetUserId: principal.id,
        action: "bootstrap_super_admin",
        details: JSON.stringify({ email: principal.email }),
        createdAt: agora,
      });
    });
    console.log(`Super Admin promovido por identificação única: ${principal.email}`);
  } catch (err) {
    console.error('Erro ao inicializar o Super Admin:', err);
    throw err;
  }
};

export const criarBannersPadrao = async () => {
  // Começa com zero banners por padrão, permitindo que o admin adicione até 10 banners manualmente
};
