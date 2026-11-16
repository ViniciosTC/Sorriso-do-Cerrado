ALTER TABLE `user`
  MODIFY COLUMN `papel` enum('admin','super_admin','artesa','cliente','vendedor','artisan') DEFAULT 'cliente',
  ADD COLUMN `is_active` boolean NOT NULL DEFAULT true,
  ADD COLUMN `deleted_at` datetime NULL;
--> statement-breakpoint
CREATE TABLE `admin_audit_logs` (
  `id` varchar(36) NOT NULL,
  `actor_id` varchar(36),
  `target_user_id` varchar(36),
  `action` varchar(100) NOT NULL,
  `details` text,
  `created_at` datetime NOT NULL,
  CONSTRAINT `admin_audit_logs_id` PRIMARY KEY(`id`)
);
