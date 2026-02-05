CREATE TABLE `daily_metrics_aggregate` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`date` text NOT NULL,
	`avg_confidence` real,
	`avg_engagement` real,
	`avg_ai_supported` real,
	`avg_traditional` real,
	`sample_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learning_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`team_id` text,
	`user_id` text,
	`metric_type` text NOT NULL,
	`value` real NOT NULL,
	`source` text DEFAULT 'system' NOT NULL,
	`metadata` text,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `intervention_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`intervention_id` text NOT NULL,
	`team_id` text NOT NULL,
	`message_id` text,
	`delivered_at` integer NOT NULL,
	`acknowledged` integer DEFAULT false,
	`acknowledged_at` integer,
	FOREIGN KEY (`intervention_id`) REFERENCES `ai_interventions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_risk_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`team_id` text NOT NULL,
	`risk_level` text NOT NULL,
	`risk_factors` text,
	`last_activity_at` integer,
	`sessions_behind` integer DEFAULT 0,
	`precheck_failure_rate` integer,
	`assessed_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
