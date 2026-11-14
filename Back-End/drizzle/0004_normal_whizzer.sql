ALTER TABLE `favoritos` MODIFY COLUMN `data` datetime DEFAULT '2026-11-13 18:42:23.277';--> statement-breakpoint
ALTER TABLE `vendas` MODIFY COLUMN `data` datetime DEFAULT '2026-11-13 18:42:23.276';--> statement-breakpoint
ALTER TABLE `produtos` ADD `categoria` varchar(100);