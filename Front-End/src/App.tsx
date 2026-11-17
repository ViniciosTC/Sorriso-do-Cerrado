import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/home';
import Produtos from './pages/produtos';
import DetalheProduto from './pages/detalhesProduto';
import Login from './pages/login';
import AdminPainel from './pages/adminPainel';
import PainelAdministrativo from './pages/painelAdministrativo';
import AdicionarProduto from './pages/adicionarProduto';
import EditarProduto from './pages/editarProduto';
import Favoritos from './pages/favoritos';
import Carrinho from './pages/carrinho';
import Cadastro from './pages/cadastro';
import Explorar from './pages/explorar';
import LojaArtesao from './pages/lojaArtesao';
import Artesaos from './pages/artesaos';
import Mensagens from './pages/mensagens';

import Perfil from './pages/perfil';
import CadastroArtesao from './pages/cadastroArtesao';
import DadosRecebimentoArtesao from './pages/dadosRecebimentoArtesao';

import RotaProtegida from './auth/rotaProtegida';
import RotaAdmin from './auth/rotaAdmin';
import { ThemeProvider } from './context/themeContext';

import './global.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/produto/:id" element={<DetalheProduto />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/artesaos" element={<Artesaos />} />
          <Route path="/loja-artesao" element={<LojaArtesao />} />
          <Route path="/loja-artesao/:id" element={<LojaArtesao />} />

          <Route
            path="/configuracoes"
            element={<Navigate to="/perfil" replace />}
          />
          <Route
            path="/perfil"
            element={
              <RotaProtegida>
                <Perfil />
              </RotaProtegida>
            }
          />
          <Route
            path="/mensagens"
            element={
              <RotaProtegida>
                <Mensagens />
              </RotaProtegida>
            }
          />
          <Route
            path="/cadastro-artesao"
            element={
              <RotaProtegida>
                <CadastroArtesao />
              </RotaProtegida>
            }
          />
          <Route
            path="/dados-recebimento"
            element={
              <RotaProtegida>
                <DadosRecebimentoArtesao />
              </RotaProtegida>
            }
          />
          <Route
            path="/editar-dados"
            element={<Navigate to="/perfil" replace />}
          />
          <Route
            path="/mudar-senha"
            element={<Navigate to="/perfil" replace />}
          />
          <Route
            path="/admin"
            element={
              <RotaAdmin>
                <AdminPainel />
              </RotaAdmin>
            }
          />
          <Route
            path="/painel-administrativo"
            element={
              <RotaAdmin somenteAdmin>
                <PainelAdministrativo />
              </RotaAdmin>
            }
          />
          <Route
            path="/admin/adicionar-produto"
            element={
              <RotaAdmin>
                <AdicionarProduto />
              </RotaAdmin>
            }
          />
          <Route
            path="/admin/editar-produto/:id"
            element={
              <RotaAdmin>
                <EditarProduto />
              </RotaAdmin>
            }
          />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;