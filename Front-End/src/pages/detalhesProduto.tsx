import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/carrinhoContext';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import BarraNavegacao from '../componentes/barraNavegacao';
import ImagemProduto from '../componentes/imagemProduto';
import Rodape from '../componentes/rodape';
import styles from './detalhesProduto.module.css';

interface Produto {
  id: number;
  nome: string;
  preco: string | number;
  imagemURL?: string;
  descricao: string;
}

function DetalheProduto() {
  const { id } = useParams();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { mostrarNotificacao } = useNotificacao();

  useEffect(() => {
    const fetchProduto = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/produtos/${id}`
        );

        setProduto(response.data);
      } catch (err) {
        setError("Não foi possível carregar os dados do produto.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setIsFavorited(false);
      return;
    }

    const fetchFavorito = async () => {
      try {
        const response = await axios.get<Produto[]>(
          'http://localhost:3000/favoritos',
          { withCredentials: true }
        );
        const produtoId = Number(id);
        setIsFavorited(response.data.some((fav) => fav.id === produtoId));
      } catch (err) {
        console.error('Erro ao verificar favorito:', err);
      }
    };

    void fetchFavorito();
  }, [id, isAuthenticated]);

  const handleAddToCart = () => {
    if (produto) {
      const produtoParaAdicionar = {
        id: produto.id,
        name: produto.nome,
        price: produto.preco,
        imageUrl: produto.imagemURL,
      };

      addToCart(produtoParaAdicionar);
    }
  };

  const handleToggleFavorite = async () => {
    if (!produto) return;

    if (!isAuthenticated) {
      mostrarNotificacao(
        'Não foi possível adicionar o produto aos favoritos: você não está logado. Por favor, faça login na sua conta para favoritar produtos.',
        'aviso'
      );
      return;
    }

    try {
      if (isFavorited) {
        await axios.delete(`http://localhost:3000/favoritos/${produto.id}`, {
          withCredentials: true,
        });
        setIsFavorited(false);
        mostrarNotificacao('Produto removido dos favoritos.', 'aviso');
      } else {
        await axios.post(
          'http://localhost:3000/favoritos',
          { id_produto: produto.id },
          { withCredentials: true }
        );
        setIsFavorited(true);
        mostrarNotificacao('Produto adicionado aos favoritos!', 'sucesso');
      }
    } catch (err: unknown) {
      console.error('Erro ao atualizar favoritos:', err);

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        sessionStorage.removeItem('sessaoAtiva');
        mostrarNotificacao(
          'O tempo da sua sessão acabou. Por favor, faça login novamente para favoritar produtos.',
          'erro'
        );
        return;
      }

      mostrarNotificacao(
        'Não foi possível atualizar os favoritos. Tente novamente.',
        'erro'
      );
    }
  };

  return (
    <div className={styles.pagina}>
      <BarraNavegacao />

      <main className={styles.conteudo}>
        {loading ? (
          <p>A carregar...</p>
        ) : error ? (
          <p>Erro: {error}</p>
        ) : produto && (
          <div className={styles.detalheProdutoContainer}>
            <ImagemProduto
              src={produto.imagemURL}
              alt={produto.nome}
              className={styles.detalheProdutoImagem}
            />

            <div className={styles.detalheProdutoInfo}>
              <h1>{produto.nome}</h1>

              <p className={styles.detalheProdutoPreco}>
                R$ {produto.preco}
              </p>

              <p className={styles.detalheProdutoDescricao}>
                {produto.descricao}
              </p>

              <div className={styles.containerAcoes}>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`${styles.botaoFavorito} ${
                    isFavorited ? styles.favoritado : ''
                  }`}
                  title={
                    isFavorited
                      ? 'Remover dos favoritos'
                      : 'Adicionar aos favoritos'
                  }
                  aria-label={
                    isFavorited
                      ? 'Remover dos favoritos'
                      : 'Adicionar aos favoritos'
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="-40 -40 592 592"
                    fill={isFavorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="40"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.iconeFavoritos}
                  >
                    <path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144 34.1-6.5 69 3.9 94.8 28.3L256 113.1l42-39.3c25.8-24.4 60.7-34.8 94.8-28.3 69.2 13.2 119.2 73.6 119.2 144v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-16.5 15.5-44 15.5-60.4 0z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={styles.botaoComprar}
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Rodape />
    </div>
  );
}

export default DetalheProduto;