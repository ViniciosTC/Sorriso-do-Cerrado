import ArtesaoModel from "../models/artesaoModel.js";
import ArtesaoPerfilModel from "../models/artesaoPerfilModel.js";
import { criarSubcontaArtesao } from "./abacatePayService.js";

const TAMANHO_MAXIMO_NOME = 100;

export const garantirSubconta = async (usuarioId: string) => {
  const existente = await ArtesaoModel.buscarSubcontaPorUsuario(usuarioId);
  if (existente) return existente;

  const perfil = await ArtesaoPerfilModel.buscarPorUsuario(usuarioId);
  if (!perfil) {
    throw new Error("Produto de artesão sem subconta financeira vinculada");
  }

  const { nomeCompleto, documento } = perfil.dadosPessoais;
  const subconta = await criarSubcontaArtesao(
    nomeCompleto.slice(0, TAMANHO_MAXIMO_NOME),
    documento,
    usuarioId,
  );
  await ArtesaoModel.salvarSubconta(usuarioId, subconta.id, subconta.devMode);

  return { subcontaId: subconta.id, devMode: subconta.devMode };
};
