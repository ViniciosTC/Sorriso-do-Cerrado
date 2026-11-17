import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/carrinhoContext';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import BarraNavegacao from '../componentes/barraNavegacao';
import ImagemProduto from '../componentes/imagemProduto';
import Rodape from '../componentes/rodape';
import PagamentoPix, { type DadosPix } from '../componentes/pagamentoPix';
import styles from './carrinho.module.css';

type Etapa = 'carrinho' | 'pagamento' | 'concluida';

interface Pagamento {
  vendaId: number;
  pix: DadosPix;
}

function Carrinho() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { mostrarNotificacao } = useNotificacao();
  const [etapa, setEtapa] = useState<Etapa>('carrinho');
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [carregando, setCarregando] = useState(false);

  const precoTotal = cartItems.reduce((total, item) => {
    const precoNumerico = parseFloat(String(item.price)) || 0;
    return total + precoNumerico * item.quantity;
  }, 0);

  const handleFinalizarCompra = async () => {
    if (!isAuthenticated) {
      mostrarNotificacao(
        'Você precisa fazer login para finalizar a compra.',
        'aviso'
      );
      return;
    }

    setCarregando(true);
    try {
      const { data } = await axios.post(
        'http://localhost:3000/vendas',
        {
          nomeCliente: user?.name || 'Cliente',
          telefoneCliente: 'Não informado',
          itens: cartItems.map(({ id, quantity }) => ({
            id,
            quantidade: quantity,
          })),
        },
        { withCredentials: true }
      );

      setPagamento({ vendaId: data.id, pix: data.pix });
      setEtapa('pagamento');
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      const mensagemErro =
        axios.isAxiosError(error) && error.response?.status === 409
          ? 'A loja responsável por este produto ainda não está habilitada para receber pagamentos. Tente novamente mais tarde.'
          : 'Falha ao registrar pedido. Tente novamente.';
      mostrarNotificacao(
        mensagemErro,
        'erro'
      );
    } finally {
      setCarregando(false);
    }
  };

  const handlePago = useCallback(() => {
    clearCart(false);
    mostrarNotificacao('Pagamento confirmado!', 'sucesso');
    setEtapa('concluida');
  }, [clearCart, mostrarNotificacao]);

  const handleExpirado = useCallback(() => {
    mostrarNotificacao(
      'O código PIX expirou. Finalize a compra novamente.',
      'aviso'
    );
    setEtapa('carrinho');
  }, [mostrarNotificacao]);

  return (
    <div>
      <BarraNavegacao />

      <main className={styles.conteudoGeralCarrinho}>
        <h2>Seu Carrinho de Compras</h2>

        {etapa === 'pagamento' && pagamento ? (
          <PagamentoPix
            vendaId={pagamento.vendaId}
            pix={pagamento.pix}
            onPago={handlePago}
            onExpirado={handleExpirado}
          />
        ) : etapa === 'concluida' ? (
          <div className={styles.mensagemSucesso}>
            <h3>Parabéns pela sua compra!</h3>

            <p>
              Obrigada por escolher o artesanato do Sorriso do Cerrado.
              O seu pagamento foi confirmado.
            </p>

            <p>
              Para combinar os detalhes da entrega,
              por favor, entre em contato conosco através do WhatsApp.
            </p>

            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkWhatsapp}
            >
              Contactar via WhatsApp
            </a>

            <Link to="/produtos" className={styles.botaoVoltar}>
              Continuar a comprar
            </Link>
          </div>
        ) : (
          <>
            {cartItems.length === 0 ? (
              <p>O seu carrinho está vazio.</p>
            ) : (
              <>
                <div className={styles.tabelaCarrinho}>
                  {cartItems.map((item) => (
                    <div key={item.id} className={styles.itemCarrinho}>
                      <Link
                        to={`/produto/${item.id}`}
                        className={styles.linkImagemProduto}
                      >
                        <ImagemProduto
                          src={item.imageUrl}
                          alt={item.name}
                          className={styles.imagemProdutoCarrinho}
                        />
                      </Link>

                      <div className={styles.infoProdutoCarrinho}>
                        <h3>
                          <Link
                            to={`/produto/${item.id}`}
                            className={styles.linkNomeProduto}
                          >
                            {item.name}
                          </Link>
                        </h3>
                        <div className={styles.controleQuantidade}>
                          <span>Quantidade:</span>
                          <div className={styles.seletorQuantidade}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className={styles.botaoQuantidade}
                              aria-label="Diminuir quantidade"
                            >
                              −
                            </button>
                            <span className={styles.valorQuantidade}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className={styles.botaoQuantidade}
                              aria-label="Aumentar quantidade"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p>
                          Preço: R${' '}
                          {parseFloat(String(item.price)).toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className={styles.botaoRemover}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.resumoCarrinho}>
                  <h3>Total: R$ {precoTotal.toFixed(2)}</h3>

                  <button
                    onClick={handleFinalizarCompra}
                    disabled={carregando}
                    className={styles.botaoFinalizar}
                  >
                    {carregando ? 'A processar...' : 'Finalizar Compra'}
                  </button>

                  <button
                    onClick={() => clearCart()}
                    className={styles.botaoLimpar}
                  >
                    Limpar Carrinho
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Rodape />
    </div>
  );
}

export default Carrinho;