
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import CartaoProduto from '../componentes/cards';

import styles from './explorar.module.css';

const categorias = [
    'Cerâmica',
    'Decoração',
    'Acessórios',
    'Tecelagem',
    'Arte em madeira',
    'Pintura',
];

const artesãos = [
    {
        id: 1,
        nome: 'Ateliê Dona Maria',
        iniciais: 'AD',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800',
        localizacao: 'Pirenópolis, GO',
        categoria: 'Crochê e bolsas',
        avaliacao: '4,9'
    },
    {
        id: 2,
        nome: 'Mãos do Cerrado',
        iniciais: 'MC',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800',
        localizacao: 'Goiânia, GO',
        categoria: 'Decoração',
        avaliacao: '4,8'
    },
    {
        id: 3,
        nome: 'Arte em Barro',
        iniciais: 'AB',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
        localizacao: 'Pirenópolis, GO',
        categoria: 'Cerâmica',
        avaliacao: '5,0'
    }
];

const produtos = [
    {
        id: 101,
        nome: 'Vaso de cerâmica artesanal',
        artesao: 'Ateliê Raízes',
        categoria: 'Cerâmica',
        preco: '89,90',
        imagemURL: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600',
    },
    {
        id: 102,
        nome: 'Cesto de fibras naturais',
        artesao: 'Mãos do Cerrado',
        categoria: 'Tecelagem',
        preco: '120,00',
        imagemURL: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600',
    },
    {
        id: 103,
        nome: 'Peça decorativa em madeira',
        artesao: 'Arte Viva',
        categoria: 'Arte em madeira',
        preco: '75,00',
        imagemURL: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=600',
    },
    {
        id: 104,
        nome: 'Objeto decorativo artesanal',
        artesao: 'Flor de Barro',
        categoria: 'Decoração',
        preco: '65,00',
        imagemURL: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600',
    },
];

function Explorar() {
    const [termoBusca, setTermoBusca] = useState('');

    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);

    function handleBuscar(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    function handleCategoriaClick(categoria: string) {
        setCategoriasSelecionadas((selecionadas) =>
            selecionadas.includes(categoria)
                ? selecionadas.filter((item) => item !== categoria)
                : [...selecionadas, categoria]
        );
    }

    const artesaosFiltrados = artesãos.filter((artesao) => {
        const correspondeBusca =
            artesao.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            artesao.categoria.toLowerCase().includes(termoBusca.toLowerCase()) ||
            artesao.localizacao.toLowerCase().includes(termoBusca.toLowerCase());

        const correspondeCategoria =
            categoriasSelecionadas.length === 0 ||
            categoriasSelecionadas.includes(artesao.categoria);

        return correspondeBusca && correspondeCategoria;
    });

    const produtosFiltrados = produtos.filter((produto) => {
        const correspondeBusca =
            produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            produto.artesao.toLowerCase().includes(termoBusca.toLowerCase());

        const correspondeCategoria =
            categoriasSelecionadas.length === 0 ||
            categoriasSelecionadas.includes(produto.categoria);

        return correspondeBusca && correspondeCategoria;
    });

    return (
        <div className={styles.paginaExplorar}>
            <BarraNavegacao />

            <main className={styles.conteudo}>
                {/* Apresentação */}
                <section className={styles.hero}>
                    <h1>
                        Artesanato do Cerrado, direto de quem faz
                    </h1>

                    <p>
                        Descubra peças feitas à mão por artesãos da região e compre direto de suas lojas.
                    </p>
                </section>

                {/* Busca e categorias */}
                <section className={styles.buscaSecao}>
                    <form className={styles.campoBusca} onSubmit={handleBuscar}>
                        <input
                            type="text"
                            placeholder="O que você está procurando?"
                            value={termoBusca}
                            onChange={(event) => setTermoBusca(event.target.value)}
                        />

                        <button type="submit">
                            Buscar
                        </button>
                    </form>

                    <div className={styles.categorias}>
                        {categorias.map((categoria) => (
                            <button
                                key={categoria}
                                type="button"
                                className={
                                    categoriasSelecionadas.includes(categoria)
                                        ? styles.categoriaAtiva
                                        : styles.categoria
                                }
                                onClick={() => handleCategoriaClick(categoria)}
                            >
                                {categoria}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Artesãos */}
                <section className={styles.secao}>
                    <div className={styles.secaoCabecalho}>
                        <div>
                            <h2 className={styles.tituloSecao}>Artesãos em destaque</h2>
                        </div>

                        <Link to="/artesaos" className={styles.verTodos}>
                            Ver todos →
                        </Link>
                    </div>

                    <div className={styles.gradeArtesaos}>
                        {artesaosFiltrados.length > 0 ? (
                            artesaosFiltrados.map((artesao) => (
                                <Link
                                    to={`/loja-artesao/${artesao.id}`}
                                    className={styles.cartaoArtesao}
                                    key={artesao.id}
                                >
                                    <div className={styles.bannerArtesao}>
                                        {artesao.bannerImage && (
                                            <img src={artesao.bannerImage} alt="" />
                                        )}
                                    </div>

                                    <div className={styles.conteudoArtesao}>
                                        <div className={styles.avatarArtesao}>
                                            {artesao.avatar ? (
                                                <img src={artesao.avatar} alt={artesao.nome} />
                                            ) : (
                                                <span>{artesao.iniciais}</span>
                                            )}
                                        </div>

                                        <h3>{artesao.nome}</h3>

                                        <p className={styles.localizacaoCategoriaArtesao}>
                                            {artesao.localizacao} • {artesao.categoria}
                                        </p>

                                        <div className={styles.avaliacaoArtesao}>
                                            <span>★</span>
                                            <p>{artesao.avaliacao} de avaliação</p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className={styles.mensagemSemResultado}>
                                Nenhum artesão ou loja encontrado para "{termoBusca}".
                            </p>
                        )}
                    </div>
                </section>

                {/* Produtos */}
                <section className={styles.secao}>
                    <div className={styles.secaoCabecalho}>
                        <div>
                            <h2 className={styles.tituloSecao}>Produtos em destaque</h2>
                        </div>

                        <Link to="/produtos" className={styles.verTodos}>
                            Ver catálogo →
                        </Link>
                    </div>

                    <div className={styles.gradeProdutos}>
                        {produtosFiltrados.length > 0 ? (
                            produtosFiltrados.map((produto) => (
                                <CartaoProduto
                                    key={produto.id}
                                    product={produto}
                                    favoritadoInicial={false}
                                />
                            ))
                        ) : (
                            <p className={styles.mensagemSemResultado}>
                                Nenhum produto encontrado para "{termoBusca}".
                            </p>
                        )}
                    </div>
                </section>
            </main>

            <Rodape />
        </div>
    );
}

export default Explorar;
