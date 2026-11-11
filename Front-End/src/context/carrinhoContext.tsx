import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNotificacao } from './notificacaoContext';

interface Product {
  id: number;
  name: string;
  price: string | number;
  imageUrl?: string;
}

interface CartItem {
  id: number;
  name: string;
  price: string | number;
  imageUrl?: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productToAdd: Product) => void;
  updateQuantity: (productId: number, newQuantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: (pedirConfirmacao?: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { mostrarNotificacao, confirmarAcao } = useNotificacao();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const localData = localStorage.getItem('shoppingCart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Erro ao carregar o carrinho do localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (productToAdd: Product) => {
    setCartItems(prevItems => {
      const isSameItemInCart = prevItems.find(
        item => item.id === productToAdd.id && item.name === productToAdd.name
      );

      if (isSameItemInCart) {
        return prevItems.map(item =>
          item.id === productToAdd.id && item.name === productToAdd.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Se havia um mock antigo no localStorage com o mesmo ID mas nome diferente,
      // ajusta o ID do mock antigo para não colidir com o produto real cadastrado
      const itensAjustados = prevItems.map(item =>
        item.id === productToAdd.id && item.name !== productToAdd.name
          ? { ...item, id: item.id + 1000 }
          : item
      );

      return [...itensAjustados, { ...productToAdd, quantity: 1 }];
    });

    mostrarNotificacao(
      `${productToAdd.name} foi adicionado ao carrinho!`,
      'sucesso'
    );
  };

  const removeFromCart = async (productId: number) => {
    const confirmar = await confirmarAcao(
      'Tem certeza que deseja remover este produto do carrinho?'
    );
    if (confirmar) {
      setCartItems(prevItems =>
        prevItems.filter(item => item.id !== productId)
      );
      mostrarNotificacao('Produto removido do carrinho.', 'aviso');
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = async (pedirConfirmacao = true) => {
    if (pedirConfirmacao) {
      const confirmar = await confirmarAcao(
        'Tem certeza que deseja limpar todo o carrinho?'
      );
      if (!confirmar) return;
      setCartItems([]);
      mostrarNotificacao('O carrinho foi esvaziado.', 'aviso');
      return;
    }

    setCartItems([]);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }

  return context;
}