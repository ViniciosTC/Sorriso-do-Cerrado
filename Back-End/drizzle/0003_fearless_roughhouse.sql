ALTER TABLE `favoritos` MODIFY COLUMN `data` datetime DEFAULT '2026-11-11 01:32:14.520';--> statement-breakpoint
ALTER TABLE `vendas` MODIFY COLUMN `data` datetime DEFAULT '2026-11-11 01:32:14.520';--> statement-breakpoint
ALTER TABLE `vendas` ADD `pagamento_id` varchar(64);