ALTER TABLE `itens_venda`
  ADD COLUMN `id_artesao` varchar(36) NULL,
  ADD COLUMN `valor_repasse` decimal(10,2) NOT NULL DEFAULT 0,
  ADD CONSTRAINT `itens_venda_id_artesao_user_id_fk`
    FOREIGN KEY (`id_artesao`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE TABLE `saques_artesao` (
  `id` varchar(36) NOT NULL,
  `id_usuario` varchar(36) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `taxa` decimal(10,2) NOT NULL,
  `status` enum('concluido','falhou') NOT NULL,
  `transferencia_id` varchar(100) NOT NULL,
  `criado_em` datetime NOT NULL,
  CONSTRAINT `saques_artesao_id_usuario_user_id_fk`
    FOREIGN KEY (`id_usuario`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  PRIMARY KEY (`id`),
  UNIQUE KEY `saques_artesao_transferencia_id_unique` (`transferencia_id`)
);
