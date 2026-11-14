import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import CartaoProduto from '../componentes/cards';
import { useAuth } from '../auth/authContext';

import styles from './produtos.module.css';

interface Produto {
  id: number;
  nome: string;
  preco: string | number;
  imagemURL?: string;
  categoria?: string;
}

const categorias = [
  'Todas',
  'Moda e acessórios',
  'Joias e bijuterias',
  'Crochê e peças artesanais',
  'Decoração',
  'Organização e armazenamento',
  'Mesa e cozinha',
  'Aromas e cuidados pessoais',
  'Jardim e plantas',
  'Presentes e lembranças',
];

function Produtos() {
  const [listaDeProdutos, setListaDeProdutos] = useState<Produto[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
  const [favoritosIds, setFavoritosIds] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let ativo = true;

    const carregarDados = async () => {
      setCarregando(true);
      setErro('');

      try {
        const resProdutos = await axios.get<Produto[]>(
          'http://localhost:3000/produtos'
        );

        if (!ativo) return;

        setListaDeProdutos(resProdutos.data);

        if (isAuthenticated) {
          const resFavoritos = await axios.get<Produto[]>(
            'http://localhost:3000/favoritos',
            { withCredentials: true }
          );

          if (!ativo) return;

          setFavoritosIds(
            resFavoritos.data.map((favorito) => favorito.id)
          );
        } else {
          setFavoritosIds([]);
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);

        if (ativo) {
          setErro('Não foi possível carregar os produtos. Tente novamente.');
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [isAuthenticated]);

  const produtosFiltrados = listaDeProdutos.filter((produto) => {
    const termo = termoBusca.trim().toLocaleLowerCase('pt-BR');

    const correspondeBusca =
      produto.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      (produto.categoria || '').toLocaleLowerCase('pt-BR').includes(termo);

    const correspondeCategoria =
      categoriaSelecionada === 'Todas' ||
      produto.categoria === categoriaSelecionada;

    return correspondeBusca && correspondeCategoria;
  });

  function handleBuscar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className={styles.paginaProdutos}>
      <BarraNavegacao />

      <main className={styles.conteudo}>
        <section className={styles.cabecalhoPagina}>
          <Link to="/explorar" className={styles.linkVoltar}>
            ← Voltar para Explorar
          </Link>

          <h1>Nosso Catálogo</h1>

          <p>
            Descubra produtos artesanais feitos com cuidado,
            criatividade e a identidade de quem transforma o
            Cerrado em arte.
          </p>
        </section>

        <section className={styles.buscaSecao}>
          <form
            className={styles.campoBusca}
            onSubmit={handleBuscar}
          >
            <input
              type="text"
              placeholder="Buscar produto por nome ou categoria..."
              value={termoBusca}
              onChange={(event) => setTermoBusca(event.target.value)}
            />

            <button type="submit">Buscar</button>
          </form>

          <div className={styles.categorias}>
            {categorias.map((categoria) => (
              <button
                key={categoria}
                type="button"
                className={
                  categoriaSelecionada === categoria
                    ? styles.categoriaAtiva
                    : styles.categoria
                }
                onClick={() => setCategoriaSelecionada(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.secaoListagem}>
          {carregando ? (
            <div className={styles.mensagemVazia}>
              <p>Carregando produtos...</p>
            </div>
          ) : erro ? (
            <div className={styles.mensagemVazia}>
              <p>{erro}</p>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className={styles.mensagemVazia}>
              <p>
                Nenhum produto encontrado para os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className={styles.gradeProdutos}>
              {produtosFiltrados.map((produto) => (
                <CartaoProduto
                  key={produto.id}
                  product={produto}
                  favoritadoInicial={favoritosIds.includes(produto.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Rodape />
    </div>
  );
}

export default Produtos;