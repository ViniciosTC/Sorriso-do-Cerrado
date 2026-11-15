import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../database/db.js";
import { artesaoCadastros, user } from "../database/schema.js";

export interface DadosCadastroArtesao {
  dadosPessoais: {
    nomeCompleto: string;
    tipoPessoa: "fisica" | "juridica";
    documento: string;
    telefone: string;
    emailProfissional: string;
    endereco: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
    };
  };
  trabalho: {
    nomePublico: string;
    apresentacao: string;
    artesanato: string;
    tecnicas: string;
    materiais: string;
    imagem: string;
  };
  dadosFinanceiros: {
    tipoPessoa: "fisica" | "juridica";
    titular: string;
    documento: string;
  };
  termosVersao: string;
}

const obterChave = () => {
  const segredo = process.env.ARTESAO_DADOS_ENCRYPTION_KEY;
  if (!segredo || segredo.length < 32) {
    throw new Error(
      "ARTESAO_DADOS_ENCRYPTION_KEY deve ter pelo menos 32 caracteres",
    );
  }
  return createHash("sha256").update(segredo).digest();
};

export const validarConfiguracaoCriptografiaArtesao = () => {
  obterChave();
};

const criptografar = (dados: DadosCadastroArtesao) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", obterChave(), iv);
  const cifrado = Buffer.concat([
    cipher.update(JSON.stringify(dados), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, cifrado].map((parte) => parte.toString("base64")).join(".");
};

const descriptografar = (conteudo: string): DadosCadastroArtesao => {
  const [ivBase64, tagBase64, cifradoBase64] = conteudo.split(".");
  if (!ivBase64 || !tagBase64 || !cifradoBase64) {
    throw new Error("Cadastro de artesão criptografado inválido");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    obterChave(),
    Buffer.from(ivBase64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
  const texto = Buffer.concat([
    decipher.update(Buffer.from(cifradoBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(texto) as DadosCadastroArtesao;
};

const ArtesaoModel = {
  buscarSubcontaPorUsuario: async (usuarioId: string) => {
    const resultado = await db
      .select({
        subcontaId: artesaoCadastros.subcontaId,
        devMode: artesaoCadastros.devMode,
      })
      .from(artesaoCadastros)
      .where(eq(artesaoCadastros.usuarioId, usuarioId));
    return resultado[0] ?? null;
  },

  buscarPorUsuario: async (usuarioId: string) => {
    const resultado = await db
      .select()
      .from(artesaoCadastros)
      .where(eq(artesaoCadastros.usuarioId, usuarioId));
    const cadastro = resultado[0];
    if (!cadastro) return null;

    return {
      dados: descriptografar(cadastro.dadosCriptografados),
      subcontaId: cadastro.subcontaId,
      devMode: cadastro.devMode,
      criadoEm: cadastro.criadoEm,
    };
  },

  concluirCadastro: async (
    usuarioId: string,
    dados: DadosCadastroArtesao,
    subcontaId: string,
    devMode: boolean,
  ) => {
    const agora = new Date();
    const dadosCriptografados = criptografar(dados);

    await db.transaction(async (transacao) => {
      await transacao
        .insert(artesaoCadastros)
        .values({
          usuarioId,
          dadosCriptografados,
          subcontaId,
          devMode,
          criadoEm: agora,
          atualizadoEm: agora,
        })
        .onDuplicateKeyUpdate({
          set: {
            dadosCriptografados,
            subcontaId,
            devMode,
            atualizadoEm: agora,
          },
        });

      await transacao
        .update(user)
        .set({ papel: "artisan", updatedAt: agora })
        .where(eq(user.id, usuarioId));
    });
  },
};

export default ArtesaoModel;
