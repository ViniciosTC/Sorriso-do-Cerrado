import { desc, eq } from "drizzle-orm";
import { db } from "../database/db.js";
import { saquesArtesao } from "../database/schema.js";

export type StatusSaque = "concluido" | "falhou";

export interface NovoSaque {
  id: string;
  usuarioId: string;
  valor: number;
  taxa: number;
  status: StatusSaque;
  transferenciaId: string;
}

const LIMITE_HISTORICO = 20;

const SaqueModel = {
  criar: async (saque: NovoSaque): Promise<void> => {
    await db.insert(saquesArtesao).values({
      ...saque,
      valor: String(saque.valor),
      taxa: String(saque.taxa),
      criadoEm: new Date(),
    });
  },

  listarPorUsuario: async (usuarioId: string) => {
    const saques = await db
      .select({
        id: saquesArtesao.id,
        valor: saquesArtesao.valor,
        taxa: saquesArtesao.taxa,
        status: saquesArtesao.status,
        criadoEm: saquesArtesao.criadoEm,
      })
      .from(saquesArtesao)
      .where(eq(saquesArtesao.usuarioId, usuarioId))
      .orderBy(desc(saquesArtesao.criadoEm))
      .limit(LIMITE_HISTORICO);

    return saques.map((saque) => ({
      ...saque,
      valor: Number(saque.valor),
      taxa: Number(saque.taxa),
    }));
  },

  atualizarStatus: async (id: string, status: StatusSaque): Promise<void> => {
    await db.update(saquesArtesao).set({ status }).where(eq(saquesArtesao.id, id));
  },
};

export default SaqueModel;
