import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/carrinhoContext';
import { useAuth } from '../auth/authContext';
import { useNotificacao } from '../context/notificacaoContext';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import styles from './carrinho.module.css';

function Carrinho() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { mostrarNotificacao } = useNotificacao();
  const [compraFinalizada, setCompraFinalizada] = useState(false);
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
      await axios.post(
        'http://localhost:3000/vendas',
        {
          nomeCliente: user?.name || 'Cliente',
          emailCliente: user?.email,
          telefoneCliente: 'Não informado',
          total: precoTotal,
        },
        { withCredentials: true }
      );

      setCompraFinalizada(true);
      clearCart(false);
      mostrarNotificacao('Pedido registrado com sucesso!', 'sucesso');
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      mostrarNotificacao(
        'Falha ao registrar pedido. Tente novamente.',
        'erro'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <BarraNavegacao />

      <main className={styles.conteudoGeralCarrinho}>
        <h2>Seu Carrinho de Compras</h2>

        {compraFinalizada ? (
          <div className={styles.mensagemSucesso}>
            <h3>Parabéns pela sua compra!</h3>

            <p>
              Obrigada por escolher o artesanato do Sorriso do Cerrado.
              O seu pedido foi registrado no sistema.
            </p>

            <p>
              Para combinar os detalhes do pagamento e da entrega,
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
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={styles.imagemProdutoCarrinho}
                      />

                      <div className={styles.infoProdutoCarrinho}>
                        <h3>{item.name}</h3>
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