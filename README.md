<p align="center">
  <img src="https://i.imgur.com/CGdLk4r.png" width="550">
</p>

<h1 align="center"> Sorriso do Cerrado - Loja de Artesanato</h1>

<p align="center">
  Sorriso do Cerrado é uma aplicação web de e-commerce, desenvolvida por alunos da Universidade Católica de Brasília.
</p>

<p align="center">
  O objetivo principal é fornecer uma plataforma digital para que Ângela Maria, uma artesã local, possa exibir, divulgar e vender os seus produtos artesanais, conectando a sua arte com um público mais amplo e promovendo a cultura do Cerrado. O projeto inclui uma área pública para clientes e uma área administrativa segura para a gestão completa do catálogo de produtos.
</p>

##  Fases do Desenvolvimento
* Fase 1: Desenvolvimento Técnico (MVP)
    * Desenvolvido na disciplina de Programação Web.
    * Nesta fase inicial, o foco foi a construção da infraestrutura técnica e funcional do sistema.
    * Entregas Técnicas: Criação do Front-end (React), Back-end (Node.js/Express) e Banco de Dados (MySQL).
    * Funcionalidades Core: Vitrine virtual de produtos e módulo administrativo para CRUD de estoque.
    * Status: Sistema funcional e pronto para operação básica.

  Fase 2: Engenharia e Refinamento
    ***Em desenvolvimento** na disciplina de Análise e Desenvolvimento de Software.
    * Elaboração de documentos
    * Diagramas e Modelagem
    * Melhorias e novas funcionaidades

## Funcionalidades

O projeto é dividido em duas experiências principais: a do cliente visitante e a da artesã administradora.

### **Para Clientes (Público)**
* Visualização da página inicial com produtos em destaque.
* Catálogo completo de produtos com funcionalidade de busca em tempo real. 
* Página de detalhe para cada produto.
* Um carrinho de compras funcional, que persiste no navegador (`localStorage`).
* Finalização de compra simulada através de um link para o WhatsApp.

### **Para a Artesã (Área Administrativa)**
* Autenticação com Better Auth e sessões em cookies para proteger as rotas de gestão.
* Painel de controle para visualizar todos os produtos registados.
* Funcionalidade **CRUD** (Criar, Ler, Atualizar, Apagar) completa para os produtos:
    * **Adicionar** novos produtos através de um formulário.
    * **Editar** as informações de produtos existentes.
    * **Excluir** produtos do catálogo.
* Função de Logout para sair da área administrativa com segurança.

## Tecnologias Utilizadas

Este projeto foi construído com as seguintes tecnologias:

| Área | Tecnologia |
| :--- | :--- |
| **Front-End** | React (com Vite), `react-router-dom`, `axios`, CSS Modules |
| **Back-End** | Node.js, Fastify |
| **Banco de Dados** | MySQL (com a biblioteca `mysql2`) |
| **Autenticação** | Better Auth, sessões em cookies |

## Como Rodar o Projeto Localmente

Para executar este projeto no seu ambiente de desenvolvimento, serão necessários dois terminais, um para o back-end e um para o front-end.

### **Pré-requisitos**
* [Node.js](https://nodejs.org/en/)
* [Git](https://git-scm.com/)
* Um servidor MySQL a correr localmente.

### **1. Back-End**
```bash
# Clone o repositório do back-end

# Entre na pasta do projeto

# Crie um ficheiro .env na raiz e configure as suas credenciais do banco de dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=suasenha
DB_NAME=sorrisodb
DB_PORT=3306

# Instale as dependências
npm install

# Inicie o servidor
npm run dev
```
> O servidor back-end vai rodar na porta 3000.

### Autenticação e administração

O cadastro e o login usam os endpoints do Better Auth (`/api/auth/sign-up/email` e `/api/auth/sign-in/email`). O papel é atribuído pelo servidor; cadastros públicos sempre recebem o papel de cliente. Usuários com e-mail ainda não verificado podem alterá-lo sem confirmação, pois o projeto ainda não configura envio de e-mails.

O papel `admin` identifica administradores comuns e `super_admin` identifica o Super Admin. O Super Admin inicial é reconhecido pelo `ADMIN_EMAIL`; se essa variável não estiver definida, o servidor promove automaticamente o único administrador ativo existente. Se houver mais de um administrador e nenhum Super Admin, configure `ADMIN_EMAIL` para a conta correta antes de iniciar. Contas já existentes são promovidas sem alterar nome, e-mail ou senha. Em uma instalação sem conta administrativa, defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` para criar explicitamente o Super Admin inicial. Para o Docker Compose, forneça essas variáveis no ambiente.

Administradores comuns podem acessar as funções administrativas existentes e consultar o Painel Administrativo (`/painel-administrativo`), incluindo as listas de contas. Tanto `admin` quanto `super_admin` podem editar dados de clientes e artesãos; essa permissão não inclui editar contas administrativas. Somente o Super Admin pode cadastrar, editar, desativar, reativar ou excluir logicamente administradores, ou desativar contas de clientes e artesãos. As desativações e exclusões são registradas na auditoria e preservam os históricos; exclusões lógicas impedem novos logins sem apagar permanentemente as contas. A migração `0007_super_admin_soft_delete` é aplicada automaticamente na inicialização.

As operações administrativas disponíveis no backend incluem `GET /usuarios/indicadores`, `GET /usuarios/administradores` e `GET /usuarios/clientes-vendedores` para administradores autenticados; `PUT /usuarios/:id` permite a `admin` e `super_admin` editar dados de clientes e artesãos, mas não de outras contas administrativas. `POST /usuarios/administradores` (cadastro com `{ "nome": "...", "email": "...", "senha": "..." }`), `PATCH /usuarios/administradores/:id` (edição de e-mail e/ou senha), `PATCH /usuarios/administradores/:id/estado` (reativação ou desativação com `{ "ativo": true }` ou `{ "ativo": false }`) e `DELETE /usuarios/administradores/:id` (exclusão lógica) são exclusivas do Super Admin. A exclusão lógica de uma conta não administrativa usa `DELETE /usuarios/:id` com `{ "confirmacao": true }` e também é exclusiva do Super Admin.

Em produção, configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL` e `ADMIN_EMAIL` no ambiente do back-end; `ADMIN_PASSWORD` é necessário somente para criar a conta inicial quando ela ainda não existir. Configure `VITE_API_URL` com a URL pública da API no front-end. O servidor recusa iniciar sem as variáveis de autenticação quando `NODE_ENV=production`.

### Cadastro de artesãos e AbacatePay

O cadastro profissional está disponível para usuários autenticados em **Torne-se um artesão**. A subconta da AbacatePay é criada somente na confirmação do cadastro; o papel `artisan` é atribuído pelo back-end após o provedor confirmar a criação. Os dados pessoais e financeiros do cadastro são cifrados no banco com AES-256-GCM. Configure `ARTESAO_DADOS_ENCRYPTION_KEY` com pelo menos 32 caracteres e mantenha uma cópia segura; sem essa chave, o cadastro não é concluído.

O modo padrão da AbacatePay é teste. Use `ABACATEPAY_MODE=test` e uma chave `abc_dev_...` em `ABACATEPAY_API_KEY_DEV` (ou `ABACATEPAY_API_KEY` para compatibilidade local). A comissão de teste padrão é 10%, ajustável por `ABACATEPAY_COMMISSION_TEST`. Cobranças continuam na API v2 e, para produtos de artesãos, o backend envia os splits em centavos após calcular o repasse no servidor. Nenhuma simulação usa fundos reais.

Para produção, a troca exige configuração explícita de `ABACATEPAY_MODE=production`, `ABACATEPAY_API_KEY_PROD` com chave `abc_prod_...` e `ABACATEPAY_COMMISSION_PROD`. Não configure a chave de produção em ambientes de teste. A criação de subcontas e splits exige as permissões `SUB_ACCOUNT:CREATE`, `SUB_ACCOUNT:READ` e `TRANSPARENT:CREATE`, além da liberação do recurso de subcontas pela AbacatePay. A API informa `devMode` e saldo da subconta, mas não expõe neste fluxo um estado de verificação individual; a verificação da conta principal para operar em produção é feita no painel da AbacatePay. Saques de subcontas são exclusivos da produção e não são iniciados pelo cadastro.

Para receber eventos, configure `ABACATEPAY_WEBHOOK_SECRET` com pelo menos 32 caracteres e cadastre no painel da AbacatePay o endpoint HTTPS público `/webhooks/abacatepay`, versão v2, para eventos de checkout transparente. O webhook valida o secret e a assinatura HMAC, ignora reentregas e atualiza o status do pedido. Em desenvolvimento local, use um túnel HTTPS público ou a CLI da AbacatePay; cadastre um webhook separado em Modo Teste. Para simular um Pix no desenvolvimento, a tela de pagamento exibe **Simular pagamento (Dev Mode)**, que chama o endpoint de simulação do provedor. A chave precisa da permissão `TRANSPARENT:CREATE`.

### **2. Front-End**
```bash
# Em um novo terminal, clone o repositório do front-end

# Entre na pasta do projeto

# Instale as dependências
npm install

# Inicie a aplicação 
npx vite
```
> A aplicação front-end estará disponível em `http://localhost:5173`.

## 👩‍💻 Autores
* [Gabriel Cézar Peres Matos](https://github.com/gbrielzera)
* [Pedro Henrique Cavalcante de Sousa](https://github.com/pedrocavati)
* [Samantha Yumi Tanaka](https://github.com/ySamantha)
* [Samuel Batista Rennó](https://github.com/SamuelBati)
* [Vinicios Trindade Costa](https://github.com/Vinhicious)

