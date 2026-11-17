import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signIn } from '../auth/auth-client';
import { useNotificacao } from '../context/notificacaoContext';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { imagens } from '../imagens';
import styles from './login.module.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const paginaAnterior = (
    location.state as { from?: string } | null
  )?.from;
  const { mostrarNotificacao } = useNotificacao();


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      console.log('Tentando realizar login...');

      const { error: err } = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (err) {
        console.error('Erro retornado pelo Better Auth:', err);
        mostrarNotificacao(
          err.message || 'Erro ao tentar fazer login.',
          'erro'
        );
        return;
      }

      console.log('Login realizado com sucesso!');
      mostrarNotificacao('Login realizado com sucesso!', 'sucesso');

      navigate(paginaAnterior || '/', { replace: true });
    } catch (error) {
      console.error('Falha na requisição de login:', error);

      mostrarNotificacao(
        'Não foi possível conectar ao servidor. Verifique se o backend está funcionando.',
        'erro'
      );
    }
  };


  return (
    <div className="pageContainer">
      <BarraNavegacao modoAutenticacao />
      <main className={styles.main}>
        <section className={styles.composicao} aria-labelledby="login-titulo">
          <div className={styles.areaVisual}>
            <img
              src={imagens.login}
              alt="Peças artesanais em fibras, cerâmica e tecido"
              className={styles.imagemVisual}
            />
          </div>

          <div className={styles.areaFormulario}>
            <div className={styles.formularioContainer}>
              <div className={styles.introducao}>
                <span className={styles.sobretitulo}>Sorriso do Cerrado</span>
                <h1 id="login-titulo">Bem-vindo de volta</h1>
                <p>Entre na sua conta para continuar explorando.</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.formulario}>
                <div className={styles.campoFormulario}>
                  <label htmlFor="login-email">E-mail</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.campoFormulario}>
                  <label htmlFor="login-senha">Senha</label>
                  <div className={styles.inputComIcone}>
                    <input
                      id="login-senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={styles.botaoVerSenha}
                      onClick={() => setMostrarSenha((prev) => !prev)}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {mostrarSenha ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button className={styles.botaoSubmit} type="submit">
                  Entrar
                </button>
                <Link to="/cadastro" className={styles.linkCadastro}>
                  Ainda não tem uma conta? <span>Cadastre-se</span>
                </Link>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Rodape />
    </div>
  );
}

export default Login;