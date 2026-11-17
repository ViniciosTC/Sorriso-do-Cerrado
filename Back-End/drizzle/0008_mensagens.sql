CREATE TABLE `admin_audit_logs` (
	`id` varchar(36) NOT NULL,
	`actor_id` varchar(36),
	`target_user_id` varchar(36),
	`action` varchar(100) NOT NULL,
	`details` text,
	`created_at` datetime NOT NULL,
	CONSTRAINT `admin_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `artesao_cadastros` (
	`id_usuario` varchar(36) NOT NULL,
	`dados_criptografados` text NOT NULL,
	`subconta_id` varchar(100) NOT NULL,
	`dev_mode` boolean NOT NULL,
	`criado_em` datetime NOT NULL,
	`atualizado_em` datetime NOT NULL,
	CONSTRAINT `artesao_cadastros_id_usuario` PRIMARY KEY(`id_usuario`),
	CONSTRAINT `artesao_cadastros_subconta_id_unique` UNIQUE(`subconta_id`)
);
--> statement-breakpoint
CREATE TABLE `artesao_perfis` (
	`id_usuario` varchar(36) NOT NULL,
	`dados_criptografados` text NOT NULL,
	`criado_em` datetime NOT NULL,
	`atualizado_em` datetime NOT NULL,
	CONSTRAINT `artesao_perfis_id_usuario` PRIMARY KEY(`id_usuario`)
);
--> statement-breakpoint
CREATE TABLE `conversas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` varchar(36) NOT NULL,
	`artesao_id` varchar(36) NOT NULL,
	`assunto` varchar(150),
	`criado_em` datetime NOT NULL,
	`atualizado_em` datetime NOT NULL,
	CONSTRAINT `conversas_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversa_cliente_artesao_unique` UNIQUE(`cliente_id`,`artesao_id`)
);
--> statement-breakpoint
CREATE TABLE `eventos_abacatepay` (
	`id` varchar(100) NOT NULL,
	`evento` varchar(100) NOT NULL,
	`criado_em` datetime NOT NULL,
	CONSTRAINT `eventos_abacatepay_id` PRIMARY KEY(`id`)
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
ALTER TABLE `favoritos` MODIFY COLUMN `data` datetime DEFAULT '2026-11-17 11:14:38.103';--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `papel` enum('admin','super_admin','artesa','cliente','vendedor','artisan') DEFAULT 'cliente';--> statement-breakpoint
ALTER TABLE `vendas` MODIFY COLUMN `data` datetime DEFAULT '2026-11-17 11:14:38.103';--> statement-breakpoint
ALTER TABLE `produtos` ADD `id_usuario` varchar(36);--> statement-breakpoint
ALTER TABLE `user` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `artesao_cadastros` ADD CONSTRAINT `artesao_cadastros_id_usuario_user_id_fk` FOREIGN KEY (`id_usuario`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `artesao_perfis` ADD CONSTRAINT `artesao_perfis_id_usuario_user_id_fk` FOREIGN KEY (`id_usuario`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversas` ADD CONSTRAINT `conversas_cliente_id_user_id_fk` FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversas` ADD CONSTRAINT `conversas_artesao_id_user_id_fk` FOREIGN KEY (`artesao_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_conversa_id_conversas_id_fk` FOREIGN KEY (`conversa_id`) REFERENCES `conversas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_remetente_id_user_id_fk` FOREIGN KEY (`remetente_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `produtos` ADD CONSTRAINT `produtos_id_usuario_user_id_fk` FOREIGN KEY (`id_usuario`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;