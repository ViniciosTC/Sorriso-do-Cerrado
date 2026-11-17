import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';

import styles from './artesaos.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export interface Artesao {
    id: string | number;
    nome: string;
    iniciais: string;
    avatar: string | null;
    bannerImage: string | null;
    localizacao: string;
    categoria: string;
    avaliacao: string;
    descricao: string;
}

export const listaArtesaos: Artesao[] = [];

function Artesaos() {
    const [termoBusca, setTermoBusca] = useState('');
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
    const [artesaos, setArtesaos] = useState<Artesao[]>(listaArtesaos);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const carregarArtesaos = async () => {
            try {
                const { data } = await axios.get<Artesao[]>(
                    `${API_URL}/usuarios/artesaos`
                );
                setArtesaos(data);
            } catch (error) {
                console.error('Erro ao buscar artesãos:', error);
            }
        };

        void carregarArtesaos();
    }, []);

    const artesaosFiltrados = artesaos.filter((artesao) => {
        const correspondeCategoria =
            categoriaSelecionada === 'Todas' ||
            artesao.categoria === categoriaSelecionada;

        const termo = termoBusca.toLowerCase();
        const correspondeBusca =
            artesao.nome.toLowerCase().includes(termo) ||
            artesao.localizacao.toLowerCase().includes(termo) ||
            artesao.categoria.toLowerCase().includes(termo);

        return correspondeCategoria && correspondeBusca;
    });

    function handleBuscar(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <div className={styles.paginaArtesaos}>
            <BarraNavegacao />

            <main className={styles.conteudo}>
                <section className={styles.cabecalhoPagina}>
                    <Link to="/explorar" className={styles.linkVoltar}>
                        ← Voltar para Explorar
                    </Link>

                    <h1>Nossos Artesãos</h1>
                    <p>
                        Conheça os ateliês e artistas que preservam a cultura e os saberes do Cerrado em cada peça feita à mão.
                    </p>
                </section>

                {/* Busca e Filtro por Categoria */}
                <section className={styles.buscaSecao}>
                    <form className={styles.campoBusca} onSubmit={handleBuscar}>
                        <input
                            type="text"
                            placeholder="Buscar artesão por nome, cidade ou especialidade..."
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

                {/* Grade de todos os artesãos */}
                <section className={styles.secaoListagem}>
                    {artesaosFiltrados.length === 0 ? (
                        <div className={styles.mensagemVazia}>
                            <p>Nenhum artesão encontrado para os filtros selecionados.</p>
                        </div>
                    ) : (
                        <div className={styles.gradeArtesaos}>
                            {artesaosFiltrados.map((artesao) => (
                                <Link
                                    to={`/loja-artesao/${artesao.id}`}
                                    className={styles.cartaoArtesao}
                                    key={artesao.id}
                                >
                                    <div className={styles.bannerArtesao}>
                                        {artesao.bannerImage && (
                                            <img src={artesao.bannerImage} alt={artesao.nome} />
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

                                        <p className={styles.descricaoCurta}>
                                            {artesao.descricao}
                                        </p>

                                        <div className={styles.rodapeCartao}>
                                            <div className={styles.avaliacaoArtesao}>
                                                <span>★</span>
                                                <p>{artesao.avaliacao} de avaliação</p>
                                            </div>

                                            <span className={styles.verLoja}>
                                                Visitar loja →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Rodape />
        </div>
    );
}

export default Artesaos;
