import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';

import styles from './artesaos.module.css';

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

export const listaArtesaosMock = [
    {
        id: 1,
        nome: 'Ateliê Dona Maria',
        iniciais: 'AD',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800',
        localizacao: 'Pirenópolis, GO',
        categoria: 'Crochê e peças artesanais',
        avaliacao: '4,9',
        descricao:
            'Peças de crochê feitas à mão com fios naturais. Cada bolsa leva dias para ficar pronta, do primeiro ponto ao acabamento.',
    },
    {
        id: 2,
        nome: 'Mãos do Cerrado',
        iniciais: 'MC',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800',
        localizacao: 'Goiânia, GO',
        categoria: 'Decoração',
        avaliacao: '4,8',
        descricao:
            'Arte e decoração inspiradas nas cores, fibras e texturas do bioma Cerrado, produzidas artesanalmente por famílias locais.',
    },
    {
        id: 3,
        nome: 'Arte em Barro',
        iniciais: 'AB',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
        localizacao: 'Pirenópolis, GO',
        categoria: 'Mesa e cozinha',
        avaliacao: '5,0',
        descricao:
            'Cerâmicas utilitárias e decorativas modeladas manualmente e queimadas em forno de alta temperatura.',
    },
    {
        id: 4,
        nome: 'Fios da Chapada',
        iniciais: 'FC',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800',
        localizacao: 'Alto Paraíso, GO',
        categoria: 'Organização e armazenamento',
        avaliacao: '4,9',
        descricao:
            'Tapetes, mantas e redes tecidos em tear manual utilizando algodão agroecológico do Cerrado.',
    },
    {
        id: 5,
        nome: 'Oficina Raiz do Pequi',
        iniciais: 'RP',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=800',
        localizacao: 'Cidade de Goiás, GO',
        categoria: 'Presentes e lembranças',
        avaliacao: '4,7',
        descricao:
            'Esculturas, tábuas e luminárias entalhadas em madeira de reaproveitamento e galhos caídos do Cerrado.',
    },
    {
        id: 6,
        nome: 'Biojoias Douradas',
        iniciais: 'BD',
        avatar: null,
        bannerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        localizacao: 'Caldas Novas, GO',
        categoria: 'Joias e bijuterias',
        avaliacao: '5,0',
        descricao:
            'Colares, brincos e pulseiras produzidos artesanalmente com capim-dourado e sementes nativas.',
    },
];

function Artesaos() {
    const [termoBusca, setTermoBusca] = useState('');
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const artesaosFiltrados = listaArtesaosMock.filter((artesao) => {
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
