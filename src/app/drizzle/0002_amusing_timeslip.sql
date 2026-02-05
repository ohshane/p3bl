PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_intervention_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`intervention_id` text NOT NULL,
	`team_id` text NOT NULL,
	`message_id` text,
	`delivered_at` integer NOT NULL,
	`acknowledged` integer DEFAULT false,
	`acknowledged_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_intervention_logs`("id", "intervention_id", "team_id", "message_id", "delivered_at", "acknowledged", "acknowledged_at") SELECT "id", "intervention_id", "team_id", "message_id", "delivered_at", "acknowledged", "acknowledged_at" FROM `intervention_logs`;--> statement-breakpoint
DROP TABLE `intervention_logs`;--> statement-breakpoint
ALTER TABLE `__new_intervention_logs` RENAME TO `intervention_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;