PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_UserLoginInfo` (
	`email` text PRIMARY KEY NOT NULL,
	`password` text,
	`id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_UserLoginInfo`("email", "password", "id") SELECT "email", "password", "id" FROM `UserLoginInfo`;--> statement-breakpoint
DROP TABLE `UserLoginInfo`;--> statement-breakpoint
ALTER TABLE `__new_UserLoginInfo` RENAME TO `UserLoginInfo`;--> statement-breakpoint
PRAGMA foreign_keys=ON;