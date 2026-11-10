
import React from 'react';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import CartaoProduto from '../componentes/cards';

import styles from './explorar.module.css';

import { useState } from 'react';

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
        id: 1,
        nome: 'Vaso de cerâmica artesanal',
        artesao: 'Ateliê Raízes',
        preco: '89,90',
        imagemURL: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600',
    },
    {
        id: 2,
        nome: 'Cesto de fibras naturais',
        artesao: 'Mãos do Cerrado',
        preco: '120,00',
        imagemURL: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600',
    },
    {
        id: 3,
        nome: 'Peça decorativa em madeira',
        artesao: 'Arte Viva',
        preco: '75,00',
        imagemURL: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=600',
    },
    {
        id: 4,
        nome: 'Objeto decorativo artesanal',
        artesao: 'Flor de Barro',
        preco: '65,00',
        imagemURL: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600',
    },
];

function Explorar() {
    const [termoBusca, setTermoBusca] = useState('');

    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);

    function handleBuscar(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        console.log('Termo pesquisado:', termoBusca);
    }

    function handleCategoriaClick(categoria: string) {
        setCategoriasSelecionadas((selecionadas) =>
            selecionadas.includes(categoria)
                ? selecionadas.filter((item) => item !== categoria)
                : [...selecionadas, categoria]
        );
    }

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

                        <span className={styles.verTodos}>Ver todos →</span>
                    </div>

                    <div className={styles.gradeArtesaos}>
                        {artesãos.slice(0, 3).map((artesao) => (
                            <div className={styles.cartaoArtesao} key={artesao.id}>
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
                            </div>
                        ))}
                    </div>
                </section>

                {/* Produtos */}
                <section className={styles.secao}>
                    <div className={styles.secaoCabecalho}>
                        <div>
                            <h2 className={styles.tituloSecao}>Produtos em destaque</h2>
                        </div>

                        <span className={styles.verTodos}>Ver catálogo →</span>
                    </div>

                    <div className={styles.gradeProdutos}>
                        {produtos.slice(0, 4).map((produto) => (
                            <CartaoProduto
                                key={produto.id}
                                product={produto}
                                favoritadoInicial={false}
                            />
                        ))}
                    </div>
                </section>
            </main>

            <Rodape />
        </div>
    );
}

export default Explorar;
