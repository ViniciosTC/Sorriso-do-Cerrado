
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import styles from './mensagens.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Conversa {
    id: number;
    clienteId: string;
    artesaoId: string;
    assunto: string | null;
    criadoEm: string;
    atualizadoEm: string;
    clienteNome: string;
    artesaoNome: string;
    ultimaMensagem: string | null;
    ultimaMensagemEm: string | null;
    mensagensNaoLidas: number;
}


interface Mensagem {
    id: number;
    conversaId: number;
    remetenteId: string;
    conteudo: string;
    enviadoEm: string;
    lida: boolean;
}

function Mensagens() {
    const { user, isAuthenticated, isArtisan } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [conversas, setConversas] = useState<Conversa[]>([]);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [conversaAtiva, setConversaAtiva] = useState<number | null>(null);
    const [conteudo, setConteudo] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');

    const buscarConversas = useCallback(async () => {
        try {
            const { data } = await axios.get<Conversa[]>(
                `${API_URL}/mensagens/conversas`,
                { withCredentials: true }
            );

            setConversas(data);

            const idUrl = Number(searchParams.get('conversa'));
            if (idUrl && data.some((item) => item.id === idUrl)) {
                setConversaAtiva(idUrl);
            } else if (!conversaAtiva && data.length > 0) {
                setConversaAtiva(data[0].id);
            }
        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
            setErro('Não foi possível carregar suas conversas.');
        } finally {
            setCarregando(false);
        }
    }, [searchParams, conversaAtiva]);

    const buscarMensagens = useCallback(async (id: number) => {
        try {
            const { data } = await axios.get<{
                conversa: Conversa;
                mensagens: Mensagem[];
            }>(`${API_URL}/mensagens/conversas/${id}`, {
                withCredentials: true,
            });

            setMensagens(data.mensagens);

            await axios.patch(
                `${API_URL}/mensagens/conversas/${id}/lidas`,
                {},
                { withCredentials: true }
            );
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            setErro('Não foi possível carregar as mensagens.');
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            void buscarConversas();
        }
    }, [isAuthenticated, buscarConversas]);

    useEffect(() => {
        if (conversaAtiva !== null) {
            setSearchParams({ conversa: String(conversaAtiva) });
            void buscarMensagens(conversaAtiva);
        }
    }, [conversaAtiva, buscarMensagens, setSearchParams]);

    useEffect(() => {
        if (conversaAtiva === null) return;

        const intervalo = window.setInterval(() => {
            void buscarMensagens(conversaAtiva);
            void buscarConversas();
        }, 5000);

        return () => window.clearInterval(intervalo);
    }, [conversaAtiva, buscarMensagens, buscarConversas]);

    const enviarMensagem = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!conteudo.trim() || conversaAtiva === null || enviando) return;

        setEnviando(true);
        try {
            await axios.post(
                `${API_URL}/mensagens/conversas/${conversaAtiva}`,
                { conteudo: conteudo.trim() },
                { withCredentials: true }
            );

            setConteudo('');
            await buscarMensagens(conversaAtiva);
            await buscarConversas();
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            setErro('Não foi possível enviar sua mensagem.');
        } finally {
            setEnviando(false);
        }
    };

    const conversaSelecionada = conversas.find(
        (item) => item.id === conversaAtiva
    );

    const nomeParticipante = (conversa: Conversa) => {
        if (user?.id === conversa.clienteId) {
            return conversa.artesaoNome;
        }

        return conversa.clienteNome;
    };

    const formatarHorario = (data: string) =>
        new Date(data).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <div className={styles.paginaMensagens}>
            <BarraNavegacao />

            <main className={styles.conteudo}>
                <div className={styles.layoutMensagens}>
                    <aside className={styles.barraLateral}>
                        <nav className={styles.menuLateral} aria-label="Menu da conta">

                            {isArtisan ? (
                                <>
                                    <button
                                        type="button"
                                        className={styles.itemMenu}
                                        onClick={() => navigate('/admin?aba=resumo')}
                                    >
                                        Resumo
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.itemMenu}
                                        onClick={() => navigate('/admin?aba=produtos')}
                                    >
                                        Produtos
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.itemMenu}
                                        onClick={() => navigate('/admin?aba=pedidos')}
                                    >
                                        Pedidos
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.itemMenuAtivo}
                                        aria-current="page"
                                    >
                                        Mensagens
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.itemMenu}
                                        onClick={() =>
                                            navigate('/admin?aba=configuracoes-loja')
                                        }
                                    >
                                        Configurações da loja
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className={styles.itemMenu}
                                        onClick={() => navigate('/perfil')}
                                    >
                                        Visão Geral
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.itemMenuAtivo}
                                        aria-current="page"
                                    >
                                        Mensagens
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.itemMenu}
                                        onClick={() => navigate('/editar-dados')}
                                    >
                                        Editar dados
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.itemMenu}
                                        onClick={() => navigate('/mudar-senha')}
                                    >
                                        Alterar senha
                                    </button>
                                </>
                            )}
                        </nav>
                    </aside>

                    <section className={styles.areaPrincipal}>
                        <header className={styles.cabecalho}>
                            <h1>Central de mensagens</h1>
                            <p>Converse com clientes e artesãos.</p>
                        </header>

                        {erro && <p className={styles.erro}>{erro}</p>}

                        <section className={styles.areaMensagens}>
                            <aside className={styles.listaConversas}>
                                <h2>Conversas</h2>

                                {carregando ? (
                                    <p className={styles.estadoVazio}>
                                        Carregando conversas...
                                    </p>
                                ) : conversas.length === 0 ? (
                                    <p className={styles.estadoVazio}>
                                        Você ainda não possui conversas.
                                    </p>
                                ) : (
                                    conversas.map((conversa) => (
                                        <button
                                            type="button"
                                            key={conversa.id}
                                            className={
                                                conversaAtiva === conversa.id
                                                    ? styles.conversaAtiva
                                                    : styles.conversa
                                            }
                                            onClick={() => setConversaAtiva(conversa.id)}
                                        >
                                            <div className={styles.cabecalhoConversa}>
                                                <strong>{nomeParticipante(conversa)}</strong>

                                                {conversa.mensagensNaoLidas > 0 && (
                                                    <span className={styles.contadorNaoLidas}>
                                                        {conversa.mensagensNaoLidas}
                                                    </span>
                                                )}
                                            </div>

                                            <span>
                                                {conversa.ultimaMensagem ||
                                                    conversa.assunto ||
                                                    'Conversa iniciada'}
                                            </span>

                                            <small>
                                                {formatarHorario(
                                                    conversa.ultimaMensagemEm || conversa.atualizadoEm
                                                )}
                                            </small>
                                        </button>
                                    ))
                                )}
                            </aside>

                            <section className={styles.chat}>
                                {conversaSelecionada ? (
                                    <>
                                        <header className={styles.cabecalhoChat}>
                                            <div>
                                                <h2>
                                                    {nomeParticipante(conversaSelecionada)}
                                                </h2>
                                                <p>
                                                    {conversaSelecionada.assunto || 'Conversa'}
                                                </p>
                                            </div>
                                        </header>

                                        <div className={styles.historico}>
                                            {mensagens.length === 0 ? (
                                                <p className={styles.estadoVazio}>
                                                    Envie a primeira mensagem desta conversa.
                                                </p>
                                            ) : (
                                                mensagens.map((mensagem) => {
                                                    const minhaMensagem =
                                                        mensagem.remetenteId === user?.id;

                                                    return (
                                                        <div
                                                            key={mensagem.id}
                                                            className={
                                                                minhaMensagem
                                                                    ? styles.minhaMensagem
                                                                    : styles.mensagemRecebida
                                                            }
                                                        >
                                                            <p>{mensagem.conteudo}</p>
                                                            <small>
                                                                {formatarHorario(mensagem.enviadoEm)}
                                                            </small>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <form
                                            className={styles.formularioMensagem}
                                            onSubmit={enviarMensagem}
                                        >
                                            <textarea
                                                value={conteudo}
                                                onChange={(event) =>
                                                    setConteudo(event.target.value)
                                                }
                                                placeholder="Digite sua mensagem..."
                                                maxLength={5000}
                                                rows={2}
                                            />

                                            <button
                                                type="submit"
                                                disabled={!conteudo.trim() || enviando}
                                            >
                                                {enviando ? 'Enviando...' : 'Enviar'}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <div className={styles.semConversa}>
                                        <h2>Suas mensagens</h2>
                                        <p>
                                            Selecione uma conversa para visualizar as mensagens.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </section>
                    </section>
                </div>
            </main>

            <Rodape />
        </div>
    );
}

export default Mensagens;
