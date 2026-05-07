CREATE TABLE `UserInfo` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`nickname` text NOT NULL,
	`user_group` integer NOT NULL,
	`avatar` text NOT NULL,
	`sign` text NOT NULL,
	`url` text NOT NULL,
	`time_offset` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `UserLoginInfo` (
	`email` text PRIMARY KEY NOT NULL,
	`password` text NOT NULL,
	`id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `UserSession` (
	`user_id` integer NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_in` integer NOT NULL,
	`create_time` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
