import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../auth/auth-client';
import { useNotificacao } from '../context/notificacaoContext';
import BarraNavegacao from '../componentes/barraNavegacao';
import Rodape from '../componentes/rodape';
import { imagens } from '../imagens';
import styles from './cadastro.module.css';

function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { mostrarNotificacao } = useNotificacao();

  const validarSenha = (valor: string): string | null => {
    if (valor.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres.';
    }
    if (!/[A-Z]/.test(valor)) {
      return 'A senha deve conter pelo menos uma letra maiúscula.';
    }
    if (!/[a-z]/.test(valor)) {
      return 'A senha deve conter pelo menos uma letra minúscula.';
    }
    if (!/\d/.test(valor)) {
      return 'A senha deve conter pelo menos um número.';
    }
    if (!/[^A-Za-z0-9]/.test(valor)) {
      return 'A senha deve conter pelo menos um caractere especial.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const erroSenha = validarSenha(senha);
    if (erroSenha) {
      setError(erroSenha);
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    const { error: err } = await signUp.email({
      email,
      password: senha,
      name: nome,
    });

    if (err) {
      setError(err.message || 'Erro ao cadastrar');
    } else {
      mostrarNotificacao('Usuário cadastrado com sucesso!', 'sucesso');
      navigate('/login');
    }
  };

  return (
    <div className="pageContainer">
      <BarraNavegacao modoAutenticacao />
      <main className={styles.main}>
        <section
          className={styles.composicao}
          aria-labelledby="cadastro-titulo"
        >
          <div className={styles.areaVisual}>
            <img
              src={imagens.cadastro}
              alt="Ateliê com peças artesanais e tecidos feitos à mão"
              className={styles.imagemVisual}
            />
          </div>

          <div className={styles.areaFormulario}>
            <div className={styles.formularioContainer}>
              <div className={styles.introducao}>
                <span className={styles.sobretitulo}>Sorriso do Cerrado</span>
                <h1 id="cadastro-titulo">Crie sua conta</h1>
                <p>Faça parte da nossa comunidade de arte e tradição.</p>
              </div>
              <form onSubmit={handleSubmit} className={styles.formulario}>
            <div className={styles.campoFormulario}>
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className={styles.campoFormulario}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.campoFormulario}>
              <label htmlFor="senha">Senha</label>
              <div className={styles.inputComIcone}>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  id="senha"
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
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
            <div className={styles.campoFormulario}>
              <label htmlFor="confirmarSenha">Confirmar Senha</label>
              <div className={styles.inputComIcone}>
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  id="confirmarSenha"
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.botaoVerSenha}
                  onClick={() => setMostrarConfirmarSenha((prev) => !prev)}
                  aria-label={mostrarConfirmarSenha ? 'Ocultar confirmação de senha' : 'Ver confirmação de senha'}
                >
                  {mostrarConfirmarSenha ? (
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
            <span className={styles.ajudaSenha}>
              Mínimo de 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.
            </span>
            {error && (
              <p className={styles.mensagemErro} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={styles.botaoSubmit}>
              Registrar
            </button>
            <Link to="/login" className={styles.linkLogin}>
              Já tem uma conta? <span>Voltar para login</span>
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

export default Cadastro;