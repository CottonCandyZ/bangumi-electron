CREATE TABLE `CollectionAction` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`command` text NOT NULL,
	`before` text NOT NULL,
	`base_revision` integer NOT NULL,
	`created_at` integer NOT NULL,
	`acknowledged_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `CollectionAction_action_id_unique` ON `CollectionAction` (`action_id`);--> statement-breakpoint
CREATE INDEX `collection_action_pending` ON `CollectionAction` (`user_id`,`subject_id`,`acknowledged_at`);--> statement-breakpoint
CREATE TABLE `CollectionEpisodeResource` (
	`episode_id` integer PRIMARY KEY NOT NULL,
	`subject_id` integer NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `collection_episode_subject` ON `CollectionEpisodeResource` (`subject_id`);--> statement-breakpoint
CREATE TABLE `LocalAccount` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`profile` text NOT NULL,
	`list_complete` integer DEFAULT false NOT NULL,
	`last_synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `LocalCollection` (
	`user_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`subject` text NOT NULL,
	`base` text NOT NULL,
	`local` text NOT NULL,
	`retained` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'clean' NOT NULL,
	`conflict` text,
	`attempt` text,
	`error` text,
	`updated_at` integer NOT NULL,
	`synced_at` integer,
	`ep_status` integer DEFAULT 0 NOT NULL,
	`vol_status` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `subject_id`)
);
--> statement-breakpoint
CREATE INDEX `local_collection_pending` ON `LocalCollection` (`user_id`,`status`);