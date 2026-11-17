import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
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
    categoriaPrincipal?: string;
    logoURL?: string;
    capaURL?: string;
    prazoProducao?: string;
    envio?: string;
    formasPagamento?: string;
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

export const validarConfiguracaoCriptografiaArtesao = () => {
  obterChave();
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

  salvarPerfil: async (
    usuarioId: string,
    dados: DadosCadastroArtesaoLocal,
  ) => {
    const agora = new Date();
    const dadosCriptografados = criptografar(dados);

    const resultado = await db
      .select()
      .from(artesaoPerfis)
      .where(eq(artesaoPerfis.usuarioId, usuarioId));

    if (resultado[0]) {
      await db
        .update(artesaoPerfis)
        .set({
          dadosCriptografados,
          atualizadoEm: agora,
        })
        .where(eq(artesaoPerfis.usuarioId, usuarioId));
    } else {
      await db.insert(artesaoPerfis).values({
        usuarioId,
        dadosCriptografados,
        criadoEm: agora,
        atualizadoEm: agora,
      });
    }

    return dados;
  },

  listarPublicos: async () => {
    const registros = await db
      .select({
        usuarioId: artesaoPerfis.usuarioId,
        dadosCriptografados: artesaoPerfis.dadosCriptografados,
      })
      .from(artesaoPerfis)
      .innerJoin(user, eq(artesaoPerfis.usuarioId, user.id))
      .where(eq(user.isActive, true));

    return registros.map((item) => {
      const dados = descriptografar(item.dadosCriptografados);
      return mapearLojaPublica(item.usuarioId, dados);
    });
  },

  buscarPublicoPorUsuario: async (usuarioId: string) => {
    const registros = await db
      .select({
        usuarioId: artesaoPerfis.usuarioId,
        dadosCriptografados: artesaoPerfis.dadosCriptografados,
      })
      .from(artesaoPerfis)
      .innerJoin(user, eq(artesaoPerfis.usuarioId, user.id))
      .where(
        and(eq(artesaoPerfis.usuarioId, usuarioId), eq(user.isActive, true)),
      );

    const registro = registros[0];
    if (!registro) return null;

    const dados = descriptografar(registro.dadosCriptografados);
    return mapearLojaPublica(registro.usuarioId, dados);
  },

  buscarNomesPublicosPorUsuarios: async (usuarioIds: string[]) => {
    const nomes = new Map<string, string>();
    const idsUnicos = [...new Set(usuarioIds.filter(Boolean))];
    if (idsUnicos.length === 0) return nomes;

    const registros = await db
      .select({
        usuarioId: artesaoPerfis.usuarioId,
        dadosCriptografados: artesaoPerfis.dadosCriptografados,
      })
      .from(artesaoPerfis)
      .where(inArray(artesaoPerfis.usuarioId, idsUnicos));

    for (const registro of registros) {
      try {
        const dados = descriptografar(registro.dadosCriptografados);
        const nomePublico = dados.trabalho?.nomePublico?.trim();
        if (nomePublico) {
          nomes.set(registro.usuarioId, nomePublico);
        }
      } catch {
        // Ignora perfis que não puderem ser descriptografados e mantém user.name
      }
    }

    return nomes;
  },
};

const obterIniciais = (texto: string) => {
  const partes = texto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "SC";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
};

const mapearLojaPublica = (
  usuarioId: string,
  dados: DadosCadastroArtesaoLocal,
) => {
  const nome = dados.trabalho.nomePublico || "Artesão";
  const cidade = dados.dadosPessoais.endereco?.cidade || "";
  const estado = dados.dadosPessoais.endereco?.estado || "";
  const localizacao =
    [cidade, estado].filter(Boolean).join(", ") || "Brasil";

  return {
    id: usuarioId,
    nome,
    iniciais: obterIniciais(nome),
    avatar: dados.trabalho.logoURL || null,
    bannerImage: dados.trabalho.capaURL || null,
    localizacao,
    categoria:
      dados.trabalho.categoriaPrincipal ||
      dados.trabalho.artesanato ||
      "Artesanato",
    avaliacao: "5,0",
    descricao: dados.trabalho.apresentacao || "",
    sobre: [
      dados.trabalho.apresentacao,
      dados.trabalho.tecnicas ? `Técnicas: ${dados.trabalho.tecnicas}` : "",
      dados.trabalho.materiais ? `Materiais: ${dados.trabalho.materiais}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    envio: dados.trabalho.envio || "Todo o Brasil",
    prazoProducao: dados.trabalho.prazoProducao || "5 a 10 dias",
    pagamento: dados.trabalho.formasPagamento || "Pix",
  };
};

export default ArtesaoPerfilModel;
