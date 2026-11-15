ALTER TABLE `user`
  MODIFY COLUMN `papel` enum('admin','artesa','cliente','vendedor','artisan') DEFAULT 'cliente';
--> statement-breakpoint
ALTER TABLE `produtos`
  ADD COLUMN `id_usuario` varchar(36) NULL;
--> statement-breakpoint
ALTER TABLE `produtos`
  ADD CONSTRAINT `produtos_usuario_id_user_id_fk`
  FOREIGN KEY (`id_usuario`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE TABLE `artesao_cadastros` (
  `id_usuario` varchar(36) NOT NULL,
  `dados_criptografados` text NOT NULL,
  `subconta_id` varchar(100) NOT NULL,
  `dev_mode` boolean NOT NULL,
  `criado_em` datetime NOT NULL,
  `atualizado_em` datetime NOT NULL,
  CONSTRAINT `artesao_cadastros_id_usuario_user_id_fk`
    FOREIGN KEY (`id_usuario`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `artesao_cadastros_subconta_id_unique` UNIQUE (`subconta_id`),
  PRIMARY KEY (`id_usuario`)
);
--> statement-breakpoint
CREATE TABLE `eventos_abacatepay` (
  `id` varchar(100) NOT NULL,
  `evento` varchar(100) NOT NULL,
  `criado_em` datetime NOT NULL,
  PRIMARY KEY (`id`)
);
