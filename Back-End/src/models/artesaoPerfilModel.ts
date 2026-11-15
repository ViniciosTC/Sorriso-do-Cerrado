import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../database/db.js";
import { artesaoPerfis, user } from "../database/schema.js";

export type TipoChavePix =
  | "cpf"
  | "cnpj"
  | "email"
  | "telefone"
  | "aleatoria";

export interface DadosRecebimento {
  pix?: {
    tipoChavePix: TipoChavePix;
    chavePix: string;
  };
  transferencia?: {
    banco: string;
    agencia: string;
    numeroConta: string;
    digitoConta?: string;
    tipoConta: "corrente" | "poupanca";
  };
}

export interface DadosCadastroArtesaoLocal {
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
  };
  dadosFinanceiros: DadosRecebimento;
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

const criptografar = (dados: DadosCadastroArtesaoLocal) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", obterChave(), iv);
  const cifrado = Buffer.concat([
    cipher.update(JSON.stringify(dados), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), cifrado]
    .map((parte) => parte.toString("base64"))
    .join(".");
};

const descriptografar = (conteudo: string): DadosCadastroArtesaoLocal => {
  const [ivBase64, tagBase64, cifradoBase64] = conteudo.split(".");
  if (!ivBase64 || !tagBase64 || !cifradoBase64) {
    throw new Error("Dados do artesão criptografados inválidos");
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

  const dados = JSON.parse(texto) as DadosCadastroArtesaoLocal;
  const recebimentoLegado = dados.dadosFinanceiros as DadosRecebimento & {
    formaRecebimento?: string;
    tipoChavePix?: TipoChavePix;
    chavePix?: string;
    banco?: string;
    agencia?: string;
    numeroConta?: string;
    digitoConta?: string;
    tipoConta?: "corrente" | "poupanca";
  };

  if (
    recebimentoLegado.formaRecebimento === "pix" &&
    recebimentoLegado.tipoChavePix &&
    recebimentoLegado.chavePix
  ) {
    dados.dadosFinanceiros = {
      pix: {
        tipoChavePix: recebimentoLegado.tipoChavePix,
        chavePix: recebimentoLegado.chavePix,
      },
    };
  } else if (
    recebimentoLegado.formaRecebimento === "transferencia" &&
    recebimentoLegado.banco &&
    recebimentoLegado.agencia &&
    recebimentoLegado.numeroConta &&
    recebimentoLegado.tipoConta
  ) {
    dados.dadosFinanceiros = {
      transferencia: {
        banco: recebimentoLegado.banco,
        agencia: recebimentoLegado.agencia,
        numeroConta: recebimentoLegado.numeroConta,
        digitoConta: recebimentoLegado.digitoConta,
        tipoConta: recebimentoLegado.tipoConta,
      },
    };
  }

  return dados;
};

const ArtesaoPerfilModel = {
  concluirCadastro: async (
    usuarioId: string,
    dados: DadosCadastroArtesaoLocal,
  ) => {
    const agora = new Date();
    const dadosCriptografados = criptografar(dados);

    await db.transaction(async (transacao) => {
      await transacao.insert(artesaoPerfis).values({
        usuarioId,
        dadosCriptografados,
        criadoEm: agora,
        atualizadoEm: agora,
      });

      const resultado = await transacao
        .update(user)
        .set({ papel: "artisan", updatedAt: agora })
        .where(and(eq(user.id, usuarioId), eq(user.papel, "cliente")));

      if (resultado[0].affectedRows !== 1) {
        throw new Error("Somente contas de usuário podem virar artesãs");
      }
    });
  },

  buscarPorUsuario: async (usuarioId: string) => {
    const resultado = await db
      .select()
      .from(artesaoPerfis)
      .where(eq(artesaoPerfis.usuarioId, usuarioId));
    const perfil = resultado[0];
    return perfil ? descriptografar(perfil.dadosCriptografados) : null;
  },

  atualizarDadosRecebimento: async (
    usuarioId: string,
    dadosFinanceiros: DadosRecebimento,
  ) => {
    const resultado = await db
      .select()
      .from(artesaoPerfis)
      .where(eq(artesaoPerfis.usuarioId, usuarioId));
    const perfil = resultado[0];
    if (!perfil) return null;

    const dados = descriptografar(perfil.dadosCriptografados);
    const dadosAtualizados = {
      ...dados,
      dadosFinanceiros,
    };
    const atualizadoEm = new Date();

    await db
      .update(artesaoPerfis)
      .set({
        dadosCriptografados: criptografar(dadosAtualizados),
        atualizadoEm,
      })
      .where(eq(artesaoPerfis.usuarioId, usuarioId));

    return dadosFinanceiros;
  },
};

export default ArtesaoPerfilModel;
