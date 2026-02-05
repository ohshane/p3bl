-- Remove expert review feature
-- Drop expert_review_comments table first (depends on expert_reviews)
DROP TABLE IF EXISTS `expert_review_comments`;--> statement-breakpoint

-- Drop expert_reviews table
DROP TABLE IF EXISTS `expert_reviews`;--> statement-breakpoint

-- Remove expert_review_enabled column from project_sessions
-- SQLite doesn't support DROP COLUMN directly, need to recreate the table
PRAGMA foreign_keys=OFF;--> statement-breakpoint

CREATE TABLE `__new_project_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`order` integer NOT NULL,
	`title` text NOT NULL,
	`topic` text,
	`guide` text,
	`weight` real DEFAULT 1 NOT NULL,
	`deliverable_type` text DEFAULT 'document' NOT NULL,
	`deliverable_title` text,
	`deliverable_description` text,
	`due_date` integer,
	`llm_model` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint

INSERT INTO `__new_project_sessions`(`id`, `project_id`, `order`, `title`, `topic`, `guide`, `weight`, `deliverable_type`, `deliverable_title`, `deliverable_description`, `due_date`, `llm_model`, `created_at`, `updated_at`) 
SELECT `id`, `project_id`, `order`, `title`, `topic`, `guide`, `weight`, `deliverable_type`, `deliverable_title`, `deliverable_description`, `due_date`, `llm_model`, `created_at`, `updated_at` FROM `project_sessions`;--> statement-breakpoint

DROP TABLE `project_sessions`;--> statement-breakpoint

ALTER TABLE `__new_project_sessions` RENAME TO `project_sessions`;--> statement-breakpoint

PRAGMA foreign_keys=ON;
