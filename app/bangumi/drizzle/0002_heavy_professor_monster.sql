CREATE TABLE `Subject` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` integer,
	`platform` text NOT NULL,
	`name` text NOT NULL,
	`name_cn` text NOT NULL,
	`summary` text NOT NULL,
	`images` text NOT NULL,
	`total_episodes` integer NOT NULL,
	`eps` integer NOT NULL,
	`volumes` integer NOT NULL,
	`series` integer NOT NULL,
	`locked` integer NOT NULL,
	`nsfw` integer NOT NULL,
	`type` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `SubjectCollection` (
	`subject_id` integer PRIMARY KEY NOT NULL,
	`on_hold` integer NOT NULL,
	`dropped` integer NOT NULL,
	`wish` integer NOT NULL,
	`collect` integer NOT NULL,
	`doing` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `SubjectRate` (
	`subject_id` integer PRIMARY KEY NOT NULL,
	`total` integer NOT NULL,
	`rank` integer NOT NULL,
	`score` integer NOT NULL,
	`count` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `SubjectTags` (
	`subject_id` integer NOT NULL,
	`name` text NOT NULL,
	`count` integer NOT NULL
);
