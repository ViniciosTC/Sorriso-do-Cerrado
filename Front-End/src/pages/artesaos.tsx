import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import PainelFiltros from '../componentes/painelFiltros';
import {
  OPCOES_ORDEM_ARTESAOS,
  useBuscaArtesaos,
} from '../hooks/useBuscaArtesaos';

import styles from './artesaos.module.css';

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

const iniciais = (nome: string) =>
    nome
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0].toUpperCase())
        .join('');

function Artesaos() {
    const {
        filtros,
        artesaos,
        carregando,
        erro,
        atualizarFiltro,
        limparFiltros,
        temFiltrosAtivos,
    } = useBuscaArtesaos();

    const categoriaSelecionada = filtros.categorias[0] ?? TODAS;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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

                {/* Busca, categoria e filtros */}
                <section className={styles.buscaSecao}>
                    <form className={styles.campoBusca} onSubmit={handleBuscar}>
                        <input
                            type="text"
                            placeholder="Buscar artesão por nome, cidade ou especialidade..."
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
                        opcoesOrdem={OPCOES_ORDEM_ARTESAOS}
                        rotuloPreco="Preço dos produtos (R$)"
                        onChange={atualizarFiltro}
                        onLimpar={limparFiltros}
                        temFiltrosAtivos={temFiltrosAtivos}
                    />
                </section>

                {/* Grade de artesãos */}
                <section className={styles.secaoListagem}>
                    {carregando ? (
                        <div className={styles.mensagemVazia}>
                            <p>Carregando artesãos...</p>
                        </div>
                    ) : erro ? (
                        <div className={styles.mensagemVazia}>
                            <p>{erro}</p>
                        </div>
                    ) : artesaos.length === 0 ? (
                        <div className={styles.mensagemVazia}>
                            <p>Nenhum artesão encontrado para os filtros selecionados.</p>
                        </div>
                    ) : (
                        <div className={styles.gradeArtesaos}>
                            {artesaos.map((artesao) => (
                                <Link
                                    to={`/loja-artesao/${artesao.id}`}
                                    className={styles.cartaoArtesao}
                                    key={artesao.id}
                                >
                                    <div className={styles.bannerArtesao} />

                                    <div className={styles.conteudoArtesao}>
                                        <div className={styles.avatarArtesao}>
                                            <span>{iniciais(artesao.nome)}</span>
                                        </div>

                                        <h3>{artesao.nome}</h3>

                                        <p className={styles.localizacaoCategoriaArtesao}>
                                            {artesao.localizacao} • {artesao.especialidade}
                                        </p>

                                        <p className={styles.descricaoCurta}>
                                            {artesao.descricao}
                                        </p>

                                        <div className={styles.rodapeCartao}>
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
