import { and, asc, count, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "../database/db.js";
import { user } from "../database/schema.js";

export const UsuarioModel = {
  buscarPorEmail: async (email: string) => {
    const resultado = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    return resultado[0] ?? null;
  },

  buscarPorId: async (id: string) => {
    const resultado = await db
      .select()
      .from(user)
      .where(eq(user.id, id));

    return resultado[0] ?? null;
  },

  listarUsuariosAtivos: async () => {
    return await db
      .select({
        id: user.id,
        nome: user.name,
        email: user.email,
        papel: user.papel,
      })
      .from(user)
      .where(and(eq(user.isActive, true), isNull(user.deletedAt)));
  },

  listarAdministradores: async () => {
    return await db
      .select({
        id: user.id,
        nome: user.name,
        email: user.email,
        papel: user.papel,
        ativo: user.isActive,
        criadoEm: user.createdAt,
      })
      .from(user)
      .where(
        and(
          inArray(user.papel, ["admin", "super_admin"]),
          isNull(user.deletedAt),
        ),
      )
      .orderBy(asc(user.name));
  },

  listarClientesVendedores: async () => {
    return await db
      .select({
        id: user.id,
        nome: user.name,
        email: user.email,
        papel: user.papel,
      })
      .from(user)
      .where(
        and(
          eq(user.isActive, true),
          isNull(user.deletedAt),
          or(
            eq(user.papel, "cliente"),
            isNull(user.papel),
            inArray(user.papel, ["artesa", "vendedor", "artisan"]),
          ),
        ),
      )
      .orderBy(asc(user.name));
  },

  contarIndicadoresAdministrativos: async () => {
    const [clientes, lojas] = await Promise.all([
      db
        .select({ total: count() })
        .from(user)
        .where(
          and(
            eq(user.isActive, true),
            isNull(user.deletedAt),
            or(eq(user.papel, "cliente"), isNull(user.papel)),
          ),
        ),
      db
        .select({ total: count() })
        .from(user)
        .where(
          and(
            eq(user.isActive, true),
            isNull(user.deletedAt),
            inArray(user.papel, ["artesa", "vendedor", "artisan"]),
          ),
        ),
    ]);

    return {
      usuarios: Number(clientes[0]?.total ?? 0),
      lojas: Number(lojas[0]?.total ?? 0),
    };
  },
};

export default UsuarioModel;