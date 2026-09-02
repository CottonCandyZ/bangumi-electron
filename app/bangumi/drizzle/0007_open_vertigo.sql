PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_UserSession` (
	`user_id` integer NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_in` integer NOT NULL,
	`create_time` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_UserSession`("user_id", "access_token", "refresh_token", "expires_in", "create_time") SELECT "user_id", "access_token", "refresh_token", "expires_in", "create_time" FROM `UserSession`;--> statement-breakpoint
DROP TABLE `UserSession`;--> statement-breakpoint
ALTER TABLE `__new_UserSession` RENAME TO `UserSession`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
UPDATE `UserSession`
SET `create_time` = COALESCE(CAST(strftime('%s', `create_time`) AS INTEGER) * 1000, 0)
WHERE typeof(`create_time`) = 'text';
