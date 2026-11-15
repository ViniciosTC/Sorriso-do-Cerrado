import type { FastifyReply, FastifyRequest } from "fastify";
import ProdutoModel, { type Produto } from "../models/produtoModel.js";

type ProductParams = { id: string };
type ProductBody = Omit<Produto, "id">;

export const listarProdutos = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const produtos = await ProdutoModel.listarTodos();
    return reply.send(produtos);
  } catch (error) {
    request.log.error({ err: error }, "Erro ao buscar produtos");
    return reply.code(500).send({ error: "Erro ao buscar produtos" });
  }
};

export const buscarProdutoPorId = async (
  request: FastifyRequest<{ Params: ProductParams }>,
  reply: FastifyReply,
) => {
  try {
    const produto = await ProdutoModel.buscarPorId(request.params.id);
    if (!produto) {
      return reply.code(404).send({ error: "Produto não encontrado" });
    }
    return reply.send(produto);
  } catch (error) {
    reply.log.error({ err: error }, "Erro ao buscar produto");
    return reply.code(500).send({ error: "Erro ao buscar produto" });
  }
};

export const listarProdutosParaGerenciamento = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!request.usuario) {
    return reply.code(401).send({ error: "Não autenticado" });
  }

  try {
    return reply.send(
      await ProdutoModel.listarParaGerenciamento(
        request.usuario.id,
        request.usuario.papel === "admin",
      ),
    );
  } catch (error) {
    request.log.error({ err: error }, "Erro ao buscar produtos do artesão");
    return reply.code(500).send({ error: "Erro ao buscar produtos" });
  }
};

export const criarProduto = async (
  request: FastifyRequest<{ Body: ProductBody }>,
  reply: FastifyReply,
) => {
  try {
    const { nome, descricao, preco, estoque, imagemURL, categoria } =
      request.body as ProductBody;
    if (!request.usuario) {
      return reply.code(401).send({ error: "Não autenticado" });
    }

    const novoProduto = await ProdutoModel.criar({
      usuarioId: request.usuario.id,
      nome,
      descricao,
      preco,
      estoque,
      imagemURL,
      categoria,
    });
    return reply.code(201).send(novoProduto);
  } catch (error) {
    reply.log.error({ err: error }, "Erro ao criar produto");
    return reply.code(500).send({ error: "Erro ao criar produto" });
  }
};

export const atualizarProduto = async (
  request: FastifyRequest<{ Params: ProductParams; Body: ProductBody }>,
  reply: FastifyReply,
) => {
  try {
    if (!request.usuario) {
      return reply.code(401).send({ error: "Não autenticado" });
    }

    const produtoExistente = await ProdutoModel.buscarPorId(request.params.id);
    if (
      !produtoExistente ||
      (produtoExistente.usuarioId !== request.usuario.id &&
        request.usuario.papel !== "admin")
    ) {
      return reply.code(produtoExistente ? 403 : 404).send({
        error: produtoExistente ? "Acesso negado" : "Produto não encontrado",
      });
    }

    const { nome, descricao, preco, estoque, imagemURL, categoria } =
      request.body;
    const atualizado = await ProdutoModel.atualizar(request.params.id, {
      nome,
      descricao,
      preco,
      estoque,
      imagemURL,
      categoria,
    });

    if (!atualizado) {
      return reply.code(404).send({ error: "Produto não encontrado" });
    }

    return reply.send({ message: "Produto atualizado com sucesso" });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao atualizar produto");
    return reply.code(500).send({ error: "Erro ao atualizar produto" });
  }
};

export const deletarProduto = async (
  request: FastifyRequest<{ Params: ProductParams }>,
  reply: FastifyReply,
) => {
  try {
    if (!request.usuario) {
      return reply.code(401).send({ error: "Não autenticado" });
    }

    const produtoExistente = await ProdutoModel.buscarPorId(request.params.id);
    if (
      !produtoExistente ||
      (produtoExistente.usuarioId !== request.usuario.id &&
        request.usuario.papel !== "admin")
    ) {
      return reply.code(produtoExistente ? 403 : 404).send({
        error: produtoExistente ? "Acesso negado" : "Produto não encontrado",
      });
    }

    const deletado = await ProdutoModel.deletar(request.params.id);
    if (!deletado) {
      return reply.code(404).send({ error: "Produto não encontrado" });
    }
    return reply.send({ message: "Produto deletado com sucesso" });
  } catch (error) {
    request.log.error({ err: error }, "Erro ao deletar produto");
    return reply.code(500).send({ error: "Erro ao deletar produto" });
  }
};
