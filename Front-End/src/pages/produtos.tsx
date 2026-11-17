import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import CartaoProduto from '../componentes/cards';
import PainelFiltros from '../componentes/painelFiltros';
import { useBuscaProdutos } from '../hooks/useBuscaProdutos';
import { useFavoritosIds } from '../hooks/useFavoritosIds';

import styles from './produtos.module.css';

const TODAS = 'Todas';

const categorias = [
  TODAS,
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
  const {
    filtros,
    produtos,
    carregando,
    erro,
    atualizarFiltro,
    limparFiltros,
    temFiltrosAtivos,
  } = useBuscaProdutos();
  const favoritosIds = useFavoritosIds();

  const categoriaSelecionada = filtros.categorias[0] ?? TODAS;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
              placeholder="Buscar por produto, artesão ou categoria..."
              value={filtros.busca}
              onChange={(event) => atualizarFiltro('busca', event.target.value)}
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
                onClick={() =>
                  atualizarFiltro(
                    'categorias',
                    categoria === TODAS ? [] : [categoria]
                  )
                }
              >
                {categoria}
              </button>
            ))}
          </div>

          <PainelFiltros
            filtros={filtros}
            onChange={atualizarFiltro}
            onLimpar={limparFiltros}
            temFiltrosAtivos={temFiltrosAtivos}
          />
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
          ) : produtos.length === 0 ? (
            <div className={styles.mensagemVazia}>
              <p>
                Nenhum produto encontrado para os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className={styles.gradeProdutos}>
              {produtos.map((produto) => (
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
