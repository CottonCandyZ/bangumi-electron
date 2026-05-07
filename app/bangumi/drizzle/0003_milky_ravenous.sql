CREATE TABLE `SubjectRatingCount` (
	`1` integer NOT NULL,
	`2` integer NOT NULL,
	`3` integer NOT NULL,
	`4` integer NOT NULL,
	`5` integer NOT NULL,
	`6` integer NOT NULL,
	`7` integer NOT NULL,
	`8` integer NOT NULL,
	`9` integer NOT NULL,
	`10` integer NOT NULL,
	`subject_id` integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE `Subject` ADD `infobox` text NOT NULL;--> statement-breakpoint
ALTER TABLE `SubjectRate` DROP COLUMN `count`;