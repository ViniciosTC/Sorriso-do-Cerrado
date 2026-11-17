import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  datetime,
  mysqlEnum,
  decimal,
  unique,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ==========================================
// TABELAS DO BETTER AUTH
// ==========================================

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
  papel: mysqlEnum("papel", ["admin", "super_admin", "artesa", "cliente", "vendedor", "artisan"]).default("cliente"),
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: datetime("deleted_at"),
});

export const usuarios = user;

export const session = mysqlTable("session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: datetime("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = mysqlTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: datetime("access_token_expires_at"),
  refreshTokenExpiresAt: datetime("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at"),
  updatedAt: datetime("updated_at"),
});

export const produtos = mysqlTable("produtos", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: varchar("id_usuario", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  estoque: int("estoque").default(0),
  imagemURL: varchar("imagemURL", { length: 255 }),
  categoria: varchar("categoria", { length: 100 }),
  criadoEm: datetime("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vendas = mysqlTable("vendas", {
  id: int("id").autoincrement().primaryKey(),
  nomeCliente: varchar("nome_cliente", { length: 100 }).notNull(),
  emailCliente: varchar("email_cliente", { length: 100 }),
  telefoneCliente: varchar("telefone_cliente", { length: 20 }),
  data: datetime("data").default(new Date()),
  total: decimal("total", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["pendente", "confirmada", "cancelada"]).default("pendente"),
  pagamentoId: varchar("pagamento_id", { length: 64 }),
});

export const itensVenda = mysqlTable("itens_venda", {
  id: int("id").autoincrement().primaryKey(),
  idVenda: int("id_venda")
    .notNull()
    .references(() => vendas.id, { onDelete: "cascade" }),
  idProduto: int("id_produto")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  quantidade: int("quantidade").notNull(),
  precoUnitario: decimal("preco_unitario", { precision: 10, scale: 2 }).notNull(),
  artesaoId: varchar("id_artesao", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  valorRepasse: decimal("valor_repasse", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
});

export const saquesArtesao = mysqlTable("saques_artesao", {
  id: varchar("id", { length: 36 }).primaryKey(),
  usuarioId: varchar("id_usuario", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  taxa: decimal("taxa", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["concluido", "falhou"]).notNull(),
  transferenciaId: varchar("transferencia_id", { length: 100 }).notNull().unique(),
  criadoEm: datetime("criado_em").notNull(),
});

export const favoritos = mysqlTable(
  "favoritos",
  {
    id: int("id").autoincrement().primaryKey(),
    usuarioId: varchar("id_usuario", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    produtoId: int("id_produto")
      .notNull()
      .references(() => produtos.id, { onDelete: "cascade" }),
    data: datetime("data").default(new Date()),
  },
  (table) => ({
    uniqueFav: unique("unique_fav").on(table.usuarioId, table.produtoId),
  })
);

export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 100 }),
  imagemURL: varchar("imagemURL", { length: 255 }).notNull(),
  link: varchar("link", { length: 255 }),
  ativo: boolean("ativo").default(true),
  ordem: int("ordem").default(0),
});

export const artesaoCadastros = mysqlTable("artesao_cadastros", {
  usuarioId: varchar("id_usuario", { length: 36 })
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  dadosCriptografados: text("dados_criptografados"),
  subcontaId: varchar("subconta_id", { length: 100 }).notNull().unique(),
  devMode: boolean("dev_mode").notNull(),
  criadoEm: datetime("criado_em").notNull(),
  atualizadoEm: datetime("atualizado_em").notNull(),
});

export const artesaoPerfis = mysqlTable("artesao_perfis", {
  usuarioId: varchar("id_usuario", { length: 36 })
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  dadosCriptografados: text("dados_criptografados").notNull(),
  criadoEm: datetime("criado_em").notNull(),
  atualizadoEm: datetime("atualizado_em").notNull(),
});

export const eventosAbacatePay = mysqlTable("eventos_abacatepay", {
  id: varchar("id", { length: 100 }).primaryKey(),
  evento: varchar("evento", { length: 100 }).notNull(),
  criadoEm: datetime("criado_em").notNull(),
});

export const adminAuditLogs = mysqlTable("admin_audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  actorId: varchar("actor_id", { length: 36 }),
  targetUserId: varchar("target_user_id", { length: 36 }),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  createdAt: datetime("created_at").notNull(),
});


export const conversas = mysqlTable(
  "conversas",
  {
    id: int("id").autoincrement().primaryKey(),

    clienteId: varchar("cliente_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    artesaoId: varchar("artesao_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    assunto: varchar("assunto", { length: 150 }),

    criadoEm: datetime("criado_em").notNull(),

    atualizadoEm: datetime("atualizado_em").notNull(),
  },
  (table) => ({
    conversaUnica: unique("conversa_cliente_artesao_unique").on(
      table.clienteId,
      table.artesaoId,
    ),
  }),
);

export const mensagens = mysqlTable("mensagens", {
  id: int("id").autoincrement().primaryKey(),

  conversaId: int("conversa_id")
    .notNull()
    .references(() => conversas.id, { onDelete: "cascade" }),

  remetenteId: varchar("remetente_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  conteudo: text("conteudo").notNull(),

  enviadoEm: datetime("enviado_em").notNull(),

  lida: boolean("lida").notNull().default(false),
});
