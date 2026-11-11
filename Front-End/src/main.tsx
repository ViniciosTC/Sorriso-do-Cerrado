import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { AuthProvider } from './auth/authContext';
import { CartProvider } from './context/carrinhoContext';
import { NotificacaoProvider } from './context/notificacaoContext';

import './global.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Elemento root não encontrado');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <NotificacaoProvider>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </NotificacaoProvider>
  </React.StrictMode>
);