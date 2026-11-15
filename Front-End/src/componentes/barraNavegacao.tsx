import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { imagens } from '../imagens';
import { useAuth } from '../auth/authContext';
import { useCart } from '../context/carrinhoContext';
import AvatarUsuario from './avatarUsuario';
import styles from './barraNavegacao.module.css';

function BarraNavegacao() {
  const { user, isAuthenticated, isAdmin, isArtisan, isUser, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', handleClickFora);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [menuAberto]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalItemsNoCarrinho = cartItems.length;

  return (
    <nav className={styles.barraNavegacao}>
      <Link to="/" className={styles.logoNavegacao}>
        <img
          src={imagens.logo}
          alt="Logo Sorriso do Cerrado"
          className={styles.logoImagem}
        />
        <span>Sorriso do Cerrado</span>
      </Link>

      <ul className={styles.linksNavegacao}>
        <li><Link to="/">Início</Link></li>
        <li><Link to="/explorar">Explorar</Link></li>

        {!isAuthenticated && (
          <li><Link to="/login">Login</Link></li>
        )}

        {isAuthenticated && (
          <li>
            <Link to="/favoritos" className={styles.linkFavoritos}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="-40 -40 592 592"
                fill="none"
                stroke="currentColor"
                strokeWidth="40"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.iconeFavoritos}
              >
                <path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144 34.1-6.5 69 3.9 94.8 28.3L256 113.1l42-39.3c25.8-24.4 60.7-34.8 94.8-28.3 69.2 13.2 119.2 73.6 119.2 144v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-16.5 15.5-44 15.5-60.4 0z"/>
              </svg>
            </Link>
          </li>
        )}

        <li>
          <Link to="/carrinho" className={styles.linkCarrinho}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.iconeCarrinho}
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>

            {totalItemsNoCarrinho > 0 && (
              <span className={styles.badgeCarrinho}>
                {totalItemsNoCarrinho}
              </span>
            )}
          </Link>
        </li>

        {isAuthenticated && (
          <li className={styles.menuUsuario} ref={menuRef}>
            <button
              className={styles.botaoMenu}
              onClick={() => setMenuAberto(!menuAberto)}
              aria-label="Abrir menu do usuário"
              title="Menu do usuário"
              aria-expanded={menuAberto}
            >
              <AvatarUsuario image={user?.image} className={styles.avatarMenu} />
            </button>

            {menuAberto && (
              <div className={styles.menuDropdown}>
                <Link
                  to="/perfil"
                  onClick={() => setMenuAberto(false)}
                >
                  Perfil
                </Link>

                <Link
                  to="/configuracoes"
                  onClick={() => setMenuAberto(false)}
                >
                  Configurações
                </Link>

                {(isArtisan || isAdmin) && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuAberto(false)}
                  >
                    Gerenciar artesanato
                  </Link>
                )}

                {isUser && (
                  <Link
                    to="/cadastro-artesao"
                    onClick={() => setMenuAberto(false)}
                  >
                    Torne-se um artesão
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className={styles.botaoLogout}
                >
                  Sair
                </button>
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}

export default BarraNavegacao;
