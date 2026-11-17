CREATE TABLE `conversas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cliente_id` varchar(36) NOT NULL,
  `artesao_id` varchar(36) NOT NULL,
  `assunto` varchar(150),
  `criado_em` datetime NOT NULL,
  `atualizado_em` datetime NOT NULL,
  CONSTRAINT `conversas_id` PRIMARY KEY(`id`),
  CONSTRAINT `conversa_cliente_artesao_unique`
    UNIQUE(`cliente_id`, `artesao_id`)
);
--> statement-breakpoint
CREATE TABLE `mensagens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `conversa_id` int NOT NULL,
  `remetente_id` varchar(36) NOT NULL,
  `conteudo` text NOT NULL,
  `enviado_em` datetime NOT NULL,
  `lida` boolean NOT NULL DEFAULT false,
  CONSTRAINT `mensagens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mensagens`
  ADD CONSTRAINT `mensagens_conversa_id_conversas_id_fk`
  FOREIGN KEY (`conversa_id`) REFERENCES `conversas`(`id`)
  ON DELETE CASCADE ON UPDATE NO ACTION;