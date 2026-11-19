import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import BarraNavegacao from '../componentes/barraNavegacao';
import CartaoProduto from '../componentes/cards';
import Rodape from '../componentes/rodape';

import { imagens } from '../imagens';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';

import styles from './home.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Produto {
  id: number;
  nome: string;
  preco: string | number;
  imagemURL?: string;
}

interface Banner {
  id: number;
  titulo: string;
  imagemURL: string;
}

function Home() {
  const [produtosDestaque, setProdutosDestaque] = useState<Produto[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [favoritosIds, setFavoritosIds] = useState<number[]>([]);
  const [carrosselPausado, setCarrosselPausado] = useState(false);

  const { isAdmin, isAuthenticated } = useAuth();
  const { mostrarNotificacao, confirmarAcao } = useNotificacao();

  const carrosselRef = useRef<HTMLDivElement>(null);
  const inputNovoBannerRef = useRef<HTMLInputElement>(null);

  const navegarBanners = (direcao: number) => {
    const carrossel = carrosselRef.current;
    const primeiroBanner = carrossel?.querySelector<HTMLElement>(
      '[data-banner-card]',
    );
    const faixa = primeiroBanner?.parentElement;

    if (!carrossel || !primeiroBanner || !faixa) {
      return;
    }

    const espacamento = Number.parseFloat(getComputedStyle(faixa).columnGap) || 0;
    carrossel.scrollBy({
      left: direcao * (primeiroBanner.offsetWidth + espacamento),
      behavior: 'smooth',
    });
  };

  const buscarProdutos = async () => {
    try {
      const response = await axios.get(`${API_URL}/produtos`);
      setProdutosDestaque(response.data.slice(0, 3));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const buscarBanners = async () => {
    try {
      const response = await axios.get(`${API_URL}/banners`);
      setBanners(response.data);
    } catch (error) {
      console.error('Erro ao buscar banners:', error);
    }
  };

  const buscarFavoritos = async () => {
    if (isAuthenticated) {
      try {
        const response = await axios.get(`${API_URL}/favoritos`, {
          withCredentials: true,
        });

        setFavoritosIds(response.data.map((fav: Produto) => fav.id));
      } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
      }
    }
  };

  const alterarBanner = async (bannerId: number, arquivo: File) => {
    try {
      const formData = new FormData();
      formData.append('imagem', arquivo);

      await axios.put(`${API_URL}/banners/${bannerId}`, formData, {
        withCredentials: true,
      });

      await buscarBanners();
      mostrarNotificacao('Banner atualizado com sucesso!', 'sucesso');
    } catch (error: unknown) {
      console.error('Erro ao atualizar banner:', error);
      const mensagem = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      mostrarNotificacao(mensagem || 'Erro ao atualizar banner.', 'erro');
    }
  };

  const adicionarBanner = async (arquivo: File) => {
    if (banners.length >= 10) {
      mostrarNotificacao('Limite máximo de 10 banners atingido.', 'aviso');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('imagem', arquivo);
      formData.append('titulo', `Banner ${banners.length + 1}`);

      await axios.post(`${API_URL}/banners`, formData, {
        withCredentials: true,
      });

      await buscarBanners();
      mostrarNotificacao('Banner adicionado com sucesso!', 'sucesso');
    } catch (error: unknown) {
      console.error('Erro ao adicionar banner:', error);
      const mensagem = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      mostrarNotificacao(mensagem || 'Erro ao adicionar banner.', 'erro');
    }
  };

  const excluirBanner = async (bannerId: number) => {
    const confirmar = await confirmarAcao(
      'Tem certeza que deseja excluir este banner?'
    );
    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/banners/${bannerId}`, {
        withCredentials: true,
      });

      await buscarBanners();
      mostrarNotificacao('Banner excluído com sucesso!', 'sucesso');
    } catch (error: unknown) {
      console.error('Erro ao excluir banner:', error);
      const mensagem = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      mostrarNotificacao(mensagem || 'Erro ao excluir banner.', 'erro');
    }
  };

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      await Promise.all([
        buscarFavoritos(),
        buscarProdutos(),
        buscarBanners(),
      ]);
    };

    carregarDadosIniciais();
  }, [isAuthenticated]);

  useEffect(() => {
    if (banners.length <= 1 || carrosselPausado || isAdmin) return;

    const intervalo = window.setInterval(() => {
      const carrossel = carrosselRef.current;
      if (!carrossel) return;

      const noFim =
        carrossel.scrollLeft + carrossel.clientWidth >= carrossel.scrollWidth - 8;

      if (noFim) {
        carrossel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        navegarBanners(1);
      }
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, [banners.length, carrosselPausado, isAdmin]);

  return (
    <div className={styles.containerPaginaInicial}>
      <BarraNavegacao />

      <header className={styles.secaoPrincipal}>
        <img
          src={imagens.principal}
          alt="Banner principal"
          className={styles.imagemPrincipal}
        />

        <div
          className={styles.bannersContainer}
          onMouseEnter={() => setCarrosselPausado(true)}
          onMouseLeave={() => setCarrosselPausado(false)}
        >
          {isAdmin && (
            <div className={styles.barraAdminBanners}>
              <button
                type="button"
                className={styles.botaoAdicionarBanner}
                onClick={() => inputNovoBannerRef.current?.click()}
                disabled={banners.length >= 10}
              >
                + Adicionar Banner
              </button>
              <span className={styles.contadorBanners}>
                {banners.length} / 10 banners
              </span>
              <input
                ref={inputNovoBannerRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (arquivo) {
                    adicionarBanner(arquivo);
                  }
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {banners.length === 0 && isAdmin && (
            <div className={styles.bannerPlaceholderAdmin}>
              <p>Nenhum banner cadastrado no momento.</p>
              <button
                type="button"
                className={styles.botaoAdicionarBanner}
                onClick={() => inputNovoBannerRef.current?.click()}
              >
                + Fazer upload do primeiro banner
              </button>
            </div>
          )}

          {banners.length > 0 && (
            <div
              className={styles.carrossel}
              ref={carrosselRef}
              role="region"
              aria-label="Banners em destaque"
              aria-roledescription="carrossel"
            >
              <div className={styles.faixaCarrossel}>
                {banners.map((banner) => (
                  <div
                    className={styles.banner}
                    key={banner.id}
                    data-banner-card
                  >
                    <img src={banner.imagemURL} alt={banner.titulo} />

                    {isAdmin && (
                      <div className={styles.acoesBanner}>
                        <button
                          type="button"
                          className={styles.botaoEditarBanner}
                          onClick={(event) =>
                            event.currentTarget.parentElement
                              ?.querySelector<HTMLInputElement>(
                                'input[type="file"]',
                              )
                              ?.click()
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={styles.botaoExcluirBanner}
                          onClick={() => excluirBanner(banner.id)}
                        >
                          Excluir
                        </button>

                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const arquivo = e.target.files?.[0];

                            if (arquivo) {
                              alterarBanner(banner.id, arquivo);
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.controleCarrossel} ${styles.anterior}`}
                onClick={() => navegarBanners(-1)}
                aria-label="Rolar para os banners anteriores"
              >
                &#10094;
              </button>
              <button
                type="button"
                className={`${styles.controleCarrossel} ${styles.proximo}`}
                onClick={() => navegarBanners(1)}
                aria-label="Rolar para os próximos banners"
              >
                &#10095;
              </button>
            </>
          )}
        </div>
      </header>

      <main className={styles.conteudoGeral}>
        <section className={styles.secaoProdutosDestaque}>
          <h2>Produtos em Destaque</h2>

          <div className={styles.gradeProdutosDestaque}>
            {produtosDestaque.map((produto) => (
              <CartaoProduto
                key={produto.id}
                product={produto}
                favoritadoInicial={favoritosIds.includes(produto.id)}
              />
            ))}
          </div>
        </section>
      </main>

      <Rodape piadaEscondida />
    </div>
  );
}

export default Home;