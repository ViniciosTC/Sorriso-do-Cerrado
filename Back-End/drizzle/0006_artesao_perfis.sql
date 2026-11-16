CREATE TABLE `artesao_perfis` (
  `id_usuario` varchar(36) NOT NULL,
  `dados_criptografados` text NOT NULL,
  `criado_em` datetime NOT NULL,
  `atualizado_em` datetime NOT NULL,
  CONSTRAINT `artesao_perfis_id_usuario_user_id_fk`
    FOREIGN KEY (`id_usuario`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  PRIMARY KEY (`id_usuario`)
);
