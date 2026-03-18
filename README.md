<p align="center">
  <img src="https://i.imgur.com/CGdLk4r.png" width="550">
</p>

<h1 align="center">🛍️ Sorriso do Cerrado - Loja de Artesanato</h1>

<p align="center">
  <img src="https://img.shields.io/badge/status-concluído-green?style=for-the-badge"/>
</p>

<p align="center">
  Aplicação web de e-commerce desenvolvida como parte de um projeto de extensão da Universidade Católica de Brasília.
</p>

<p align="center">
  O objetivo é fornecer uma plataforma digital para que uma artesã local possa divulgar e vender seus produtos, conectando sua arte a um público maior e promovendo a cultura do Cerrado.
</p>

---

## ✨ Funcionalidades

O projeto é dividido em duas experiências principais: cliente e administração.

### 👥 Área do Cliente
- Visualização de produtos em destaque  
- Catálogo com busca em tempo real  
- Página de detalhes dos produtos  
- Carrinho de compras com persistência (`localStorage`)  
- Finalização de compra via WhatsApp  

### 🔐 Área Administrativa
- Autenticação com JWT  
- Painel de controle de produtos  
- CRUD completo:
  - Adicionar produtos  
  - Editar produtos  
  - Excluir produtos  
- Logout seguro  

---

## 🛠️ Tecnologias Utilizadas

| Área | Tecnologias |
|------|------------|
| **Front-End** | React (Vite), React Router, Axios, CSS Modules |
| **Back-End** | Node.js, Express |
| **Banco de Dados** | MySQL (`mysql2`) |
| **Autenticação** | JWT, bcrypt |

---

## 🚀 Como executar

### 📋 Pré-requisitos
- Node.js  
- Git  
- MySQL rodando localmente  

---

### 🔧 Back-End

```bash
# Clone o repositório
git clone <url-do-backend>

# Acesse a pasta
cd <nome-do-backend>

# Crie o arquivo .env na raiz
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=sorrisodb
DB_PORT=3306

# Instale as dependências
npm install

# Inicie o servidor
npx nodemon src/app.js

O servidor backend rodará em:

http://localhost:3000
💻 Front-End
# Clone o repositório
git clone <url-do-frontend>

# Acesse a pasta
cd <nome-do-frontend>

# Instale as dependências
npm install

# Inicie a aplicação
npx vite

A aplicação estará disponível em:

http://localhost:5173
👩‍💻 Autores

Samantha Yumi Tanaka

Samuel Batista Rennó

Samuel Rodrigues da Silva

Vinicios Trindade Costa

Wictor Emanoel Ponte Menezes


Se quiser, depois eu te deixo isso ainda mais “nível GitHub top” (com deploy, prints, badges melhor
