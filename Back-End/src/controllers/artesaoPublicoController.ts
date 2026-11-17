import type { FastifyReply, FastifyRequest } from "fastify";
import ArtesaoPerfilModel, {
  type ArtesaoPublico,
} from "../models/artesaoPerfilModel.js";
import ProdutoModel, { type FiltrosProduto } from "../models/produtoModel.js";

export const ORDENS_ARTESAO = [
  "recentes",
  "antigos",
  "nome_az",
  "nome_za",
] as const;

export type OrdemArtesao = (typeof ORDENS_ARTESAO)[number];

export type FiltrosArtesao = Pick<
  FiltrosProduto,
  "busca" | "categoria" | "precoMin" | "precoMax"
> & { ordem?: OrdemArtesao };

const COMPARADORES: Record<
  OrdemArtesao,
  (a: ArtesaoPublico, b: ArtesaoPublico) => number
> = {
  recentes: (a, b) => b.criadoEm.getTime() - a.criadoEm.getTime(),
  antigos: (a, b) => a.criadoEm.getTime() - b.criadoEm.getTime(),
  nome_az: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  nome_za: (a, b) => b.nome.localeCompare(a.nome, "pt-BR"),
};

const paraResposta = ({
  id,
  nome,
  localizacao,
  especialidade,
  descricao,
}: ArtesaoPublico) => ({ id, nome, localizacao, especialidade, descricao });

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const listarArtesaos = async (
  request: FastifyRequest<{ Querystring: FiltrosArtesao }>,
  reply: FastifyReply,
) => {
  try {
    const { busca, ordem = "recentes", ...filtrosProduto } = request.query;
    const filtraPorProduto =
      Boolean(filtrosProduto.categoria?.length) ||
      filtrosProduto.precoMin !== undefined ||
      filtrosProduto.precoMax !== undefined;

    const [artesaos, idsComProduto] = await Promise.all([
      ArtesaoPerfilModel.listarPublicos(),
      filtraPorProduto
        ? ProdutoModel.idsDeArtesaosComProduto(filtrosProduto)
        : null,
    ]);

    const termo = normalizar(busca?.trim() ?? "");

    return reply.send(
      artesaos
        .filter((artesao) => !idsComProduto || idsComProduto.has(artesao.id))
        .filter((artesao) =>
          normalizar(
            `${artesao.nome} ${artesao.localizacao} ${artesao.especialidade}`,
          ).includes(termo),
        )
        .sort(COMPARADORES[ordem])
        .map(paraResposta),
    );
  } catch (error) {
    request.log.error({ err: error }, "Erro ao listar artesãos");
    return reply.code(500).send({ error: "Erro ao buscar artesãos" });
  }
};

export const obterArtesao = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const artesao = await ArtesaoPerfilModel.buscarPublico(request.params.id);
    if (!artesao) {
      return reply.code(404).send({ error: "Artesão não encontrado" });
    }
    return reply.send(paraResposta(artesao));
  } catch (error) {
    request.log.error({ err: error }, "Erro ao buscar artesão");
    return reply.code(500).send({ error: "Erro ao buscar artesão" });
  }
};
