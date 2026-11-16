
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import CartaoProduto from '../componentes/cards';
import { useAuth } from '../auth/authContext';

import styles from './explorar.module.css';

interface Produto {
    id: number;
    nome: string;
    artesao?: string;
    categoria?: string;
    preco: string | number;
    imagemURL?: string;
}

const categorias = [
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

interface Artesao {
    id: number;
    nome: string;
    iniciais: string;
    avatar: string | null;
    bannerImage: string | null;
    localizacao: string;
    categoria: string;
    avaliacao: string;
}

const artesãos: Artesao[] = [];

function Explorar() {
    const [termoBusca, setTermoBusca] = useState('');
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
    const [produtosBanco, setProdutosBanco] = useState<Produto[]>([]);
    const [favoritosIds, setFavoritosIds] = useState<number[]>([]);

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const resProdutos = await axios.get<Produto[]>('http://localhost:3000/produtos');
                setProdutosBanco(resProdutos.data);

                if (isAuthenticated) {
                    const resFavoritos = await axios.get<Produto[]>('http://localhost:3000/favoritos', {
                        withCredentials: true,
                    });
                    setFavoritosIds(resFavoritos.data.map((fav) => fav.id));
                }
            } catch (error) {
                console.error('Erro ao buscar produtos na tela explorar:', error);
            }
        };

        carregarDados();
    }, [isAuthenticated]);

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

    const todosProdutos: Produto[] = produtosBanco;

    const produtosFiltrados = todosProdutos.filter((produto) => {
        const termo = termoBusca.toLowerCase();
        const correspondeBusca =
            produto.nome.toLowerCase().includes(termo) ||
            (produto.artesao || '').toLowerCase().includes(termo) ||
            (produto.categoria || '').toLowerCase().includes(termo);

        const correspondeCategoria =
            categoriasSelecionadas.length === 0 ||
            (!!produto.categoria && categoriasSelecionadas.includes(produto.categoria));

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
                {artesaosFiltrados.length > 0 && (
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
                            {artesaosFiltrados.map((artesao) => (
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
                            ))}
                        </div>
                    </section>
                )}

                {/* Produtos */}
                {produtosFiltrados.length > 0 && (
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
                            {produtosFiltrados.map((produto) => (
                                <CartaoProduto
                                    key={produto.id}
                                    product={produto}
                                    favoritadoInicial={favoritosIds.includes(produto.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {artesaosFiltrados.length === 0 && produtosFiltrados.length === 0 && (
                    <p className={styles.mensagemSemResultado}>
                        Nenhum artesão ou produto encontrado para os filtros selecionados.
                    </p>
                )}
            </main>

            <Rodape />
        </div>
    );
}

export default Explorar;
