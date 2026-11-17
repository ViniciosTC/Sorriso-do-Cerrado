import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import CartaoProduto from '../componentes/cards';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';

import styles from './lojaArtesao.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Produto {
    id: number;
    nome: string;
    preco: string | number;
    imagemURL?: string;
    lojaArtesaoId?: number;
}

interface LojaArtesaoInfo {
    id: string | number;
    nome: string;
    iniciais: string;
    avatar: string | null;
    bannerImage: string | null;
    localizacao: string;
    categoria: string;
    avaliacao: string;
    descricao: string;
    sobre: string;
    envio: string;
    prazoProducao: string;
    pagamento: string;
}

interface PerfilArtesaoApi {
    dadosPessoais?: {
        endereco?: {
            cidade?: string;
            estado?: string;
        };
    };
    trabalho?: {
        nomePublico?: string;
        apresentacao?: string;
        artesanato?: string;
        tecnicas?: string;
        materiais?: string;
        categoriaPrincipal?: string;
        logoURL?: string;
        capaURL?: string;
        prazoProducao?: string;
        envio?: string;
        formasPagamento?: string;
    };
}

const obterIniciais = (texto: string) => {
    const partes = texto.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'SC';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
};

const lojasArtesaos: LojaArtesaoInfo[] = [];

function LojaArtesao() {
    const { id } = useParams<{ id: string }>();
    const { isArtisan, isAdmin, user } = useAuth();
    const { mostrarNotificacao } = useNotificacao();

    const [abaAtiva, setAbaAtiva] = useState<'produtos' | 'sobre' | 'avaliacoes'>('produtos');
    const [ordenacao, setOrdenacao] = useState('mais_vendidos');
    const [seguindo, setSeguindo] = useState(false);
    const [lojaPropria, setLojaPropria] = useState<LojaArtesaoInfo | null>(null);
    const [produtosLoja, setProdutosLoja] = useState<Produto[]>([]);
    const [carregando, setCarregando] = useState(
        Boolean(id) || isArtisan || isAdmin
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (!id && !isArtisan && !isAdmin) {
            setCarregando(false);
            return;
        }

        let ativo = true;
        setCarregando(true);

        const carregarLoja = async () => {
            try {
                if (id) {
                    const { data } = await axios.get<{
                        loja: LojaArtesaoInfo;
                        produtos: Produto[];
                    }>(`${API_URL}/usuarios/artesaos/${id}`);

                    if (!ativo) return;
                    setLojaPropria(data.loja);
                    setProdutosLoja(data.produtos || []);
                    return;
                }

                const [resPerfil, resProdutos] = await Promise.all([
                    axios.get<{ perfil: PerfilArtesaoApi | null }>(
                        `${API_URL}/usuarios/artesao/perfil`,
                        { withCredentials: true }
                    ),
                    axios.get<Produto[]>(`${API_URL}/produtos/meus`, {
                        withCredentials: true,
                    }),
                ]);

                if (!ativo) return;

                const perfil = resPerfil.data?.perfil;
                if (perfil?.trabalho) {
                    const nome = perfil.trabalho.nomePublico || user?.name || 'Minha Loja';
                    const cidade = perfil.dadosPessoais?.endereco?.cidade || '';
                    const estado = perfil.dadosPessoais?.endereco?.estado || '';
                    const localizacao = [cidade, estado].filter(Boolean).join(', ') || 'Brasil';

                    setLojaPropria({
                        id: 0,
                        nome,
                        iniciais: obterIniciais(nome),
                        avatar: perfil.trabalho.logoURL || null,
                        bannerImage: perfil.trabalho.capaURL || null,
                        localizacao,
                        categoria:
                            perfil.trabalho.categoriaPrincipal ||
                            perfil.trabalho.artesanato ||
                            'Artesanato',
                        avaliacao: '5,0',
                        descricao: perfil.trabalho.apresentacao || '',
                        sobre: [
                            perfil.trabalho.apresentacao,
                            perfil.trabalho.tecnicas
                                ? `Técnicas: ${perfil.trabalho.tecnicas}`
                                : '',
                            perfil.trabalho.materiais
                                ? `Materiais: ${perfil.trabalho.materiais}`
                                : '',
                        ]
                            .filter(Boolean)
                            .join('\n\n'),
                        envio: perfil.trabalho.envio || 'Todo o Brasil',
                        prazoProducao: perfil.trabalho.prazoProducao || '5 a 10 dias',
                        pagamento: perfil.trabalho.formasPagamento || 'Pix',
                    });
                }

                setProdutosLoja(resProdutos.data || []);
            } catch (error) {
                console.error('Erro ao carregar dados da loja:', error);
                if (ativo) {
                    setLojaPropria(null);
                    setProdutosLoja([]);
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        };

        void carregarLoja();

        return () => {
            ativo = false;
        };
    }, [id, isArtisan, isAdmin, user?.name]);

    const lojaArtesaoAtual =
        lojaPropria ||
        lojasArtesaos.find((item) => item.id === Number(id)) ||
        lojasArtesaos[0];

    if (carregando) {
        return (
            <div className={styles.paginaLojaArtesao}>
                <BarraNavegacao />
                <main className={styles.mainContainer}>
                    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                        <p>Carregando loja...</p>
                    </div>
                </main>
                <Rodape />
            </div>
        );
    }

    if (!lojaArtesaoAtual) {
        return (
            <div className={styles.paginaLojaArtesao}>
                <BarraNavegacao />
                <main className={styles.mainContainer}>
                    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                        <h2>Artesão ou loja não encontrada</h2>
                        <p
                            style={{
                                marginTop: '1rem',
                                color: 'var(--theme-text-secondary)',
                            }}
                        >
                            Nenhum artesão cadastrado no momento.
                        </p>
                    </div>
                </main>
                <Rodape />
            </div>
        );
    }

    const produtosOrdenados = [...produtosLoja].sort((a, b) => {
        const precoA = parseFloat(String(a.preco).replace(',', '.')) || 0;
        const precoB = parseFloat(String(b.preco).replace(',', '.')) || 0;

        if (ordenacao === 'menor_preco') {
            return precoA - precoB;
        }
        if (ordenacao === 'maior_preco') {
            return precoB - precoA;
        }
        return 0;
    });

    function handleSeguirLoja() {
        setSeguindo((estadoAnterior) => !estadoAnterior);
    }

    function handleEnviarMensagem() {
        mostrarNotificacao(
            `Funcionalidade de mensagens para ${lojaArtesaoAtual.nome} estará disponível em breve!`,
            'aviso'
        );
    }

    return (
        <div className={styles.paginaLojaArtesao}>
            <BarraNavegacao />

            <main className={styles.mainContainer}>
                {/* Imagem da Capa */}
                <div className={styles.capaContainer}>
                    {lojaArtesaoAtual.bannerImage ? (
                        <img
                            src={lojaArtesaoAtual.bannerImage}
                            alt={`Capa de ${lojaArtesaoAtual.nome}`}
                            className={styles.capaImagem}
                        />
                    ) : (
                        <span className={styles.capaTexto}>IMAGEM DA CAPA</span>
                    )}
                </div>

                <div className={styles.conteudo}>
                {/* Cabeçalho da Loja do Artesão */}
                <section className={styles.cartaoCabecalho}>
                    <div className={styles.infoPrincipal}>
                        <div className={styles.avatarLojaArtesao}>
                            {lojaArtesaoAtual.avatar ? (
                                <img src={lojaArtesaoAtual.avatar} alt={lojaArtesaoAtual.nome} />
                            ) : (
                                <span>{lojaArtesaoAtual.iniciais}</span>
                            )}
                        </div>

                        <div className={styles.dadosLojaArtesao}>
                            <h1>{lojaArtesaoAtual.nome}</h1>

                            <div className={styles.metadados}>
                                <span className={styles.itemMetadado}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    {lojaArtesaoAtual.localizacao}
                                </span>

                                <span className={styles.itemMetadado}>
                                    <span className={styles.estrela}>★</span>
                                    {lojaArtesaoAtual.avaliacao} de avaliação
                                </span>

                                <span className={styles.itemMetadado}>
                                    {lojaArtesaoAtual.categoria}
                                </span>
                            </div>

                            <p className={styles.descricaoLojaArtesao}>
                                {lojaArtesaoAtual.descricao}
                            </p>
                        </div>
                    </div>

                    <div className={styles.acoesCabecalho}>
                        <button
                            type="button"
                            className={styles.botaoSeguir}
                            onClick={handleSeguirLoja}
                        >
                            {seguindo ? 'Seguindo loja' : 'Seguir loja'}
                        </button>

                        <button
                            type="button"
                            className={styles.botaoMensagem}
                            onClick={handleEnviarMensagem}
                        >
                            Enviar mensagem
                        </button>
                    </div>
                </section>

                {/* Área Principal: Produtos + Barra Lateral */}
                <div className={styles.corpoLoja}>
                    <section className={styles.colunaPrincipal}>
                        {/* Abas e Ordenação */}
                        <div className={styles.barraControles}>
                            <div className={styles.abas}>
                                <button
                                    type="button"
                                    className={
                                        abaAtiva === 'produtos'
                                            ? styles.abaAtiva
                                            : styles.aba
                                    }
                                    onClick={() => setAbaAtiva('produtos')}
                                >
                                    Produtos
                                </button>

                                <button
                                    type="button"
                                    className={
                                        abaAtiva === 'sobre'
                                            ? styles.abaAtiva
                                            : styles.aba
                                    }
                                    onClick={() => setAbaAtiva('sobre')}
                                >
                                    Sobre
                                </button>

                                <button
                                    type="button"
                                    className={
                                        abaAtiva === 'avaliacoes'
                                            ? styles.abaAtiva
                                            : styles.aba
                                    }
                                    onClick={() => setAbaAtiva('avaliacoes')}
                                >
                                    Avaliações
                                </button>
                            </div>

                            {abaAtiva === 'produtos' && (
                                <div className={styles.ordenacaoContainer}>
                                    <label htmlFor="ordenarPor">Ordenar por</label>
                                    <select
                                        id="ordenarPor"
                                        value={ordenacao}
                                        onChange={(e) => setOrdenacao(e.target.value)}
                                        className={styles.selectOrdenacao}
                                    >
                                        <option value="mais_vendidos">Mais vendidos</option>
                                        <option value="menor_preco">Menor preço</option>
                                        <option value="maior_preco">Maior preço</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Conteúdo da Aba Selecionada */}
                        {abaAtiva === 'produtos' && (
                            <div className={styles.gradeProdutos}>
                                {produtosOrdenados.map((produto) => (
                                    <CartaoProduto
                                        key={produto.id}
                                        product={produto}
                                        favoritadoInicial={false}
                                    />
                                ))}
                            </div>
                        )}

                        {abaAtiva === 'sobre' && (
                            <div className={styles.cartaoSecundario}>
                                <h3>Sobre {lojaArtesaoAtual.nome}</h3>
                                <p>{lojaArtesaoAtual.sobre}</p>
                            </div>
                        )}

                        {abaAtiva === 'avaliacoes' && (
                            <div className={styles.cartaoSecundario}>
                                <h3>Avaliações da loja ({lojaArtesaoAtual.avaliacao} ★)</h3>
                                <p>As avaliações detalhadas dos clientes estarão disponíveis em breve.</p>
                            </div>
                        )}
                    </section>

                    {/* Coluna Lateral Direita */}
                    <aside className={styles.colunaLateral}>
                        <div className={styles.cartaoLateral}>
                            <h3>Informações da loja</h3>

                            <div className={styles.blocoInfo}>
                                <strong>Envio</strong>
                                <p>{lojaArtesaoAtual.envio}</p>
                            </div>

                            <div className={styles.blocoInfo}>
                                <strong>Prazo de produção</strong>
                                <p>{lojaArtesaoAtual.prazoProducao}</p>
                            </div>

                            <div className={styles.blocoInfo}>
                                <strong>Pagamento</strong>
                                <p>{lojaArtesaoAtual.pagamento}</p>
                            </div>
                        </div>

                        <div className={styles.cartaoLateral}>
                            <h3>Dúvidas?</h3>
                            <p className={styles.textoDuvidas}>
                                Fale direto com a artesã antes de comprar.
                            </p>
                            <button
                                type="button"
                                className={styles.linkMensagemLoja}
                                onClick={handleEnviarMensagem}
                            >
                                Enviar mensagem para a loja
                            </button>
                        </div>
                    </aside>
                </div>
                </div>
            </main>

            <Rodape />
        </div>
    );
}

export default LojaArtesao;
