CREATE TABLE `challenges` (
	`cookie` text PRIMARY KEY NOT NULL,
	`challenge` text NOT NULL,
	`webauthn_user_id` text,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `challenge.expires` ON `challenges` (`expires`);--> statement-breakpoint
CREATE TABLE `cookies` (
	`value` text PRIMARY KEY NOT NULL,
	`id_hash` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cookies.expires` ON `cookies` (`expires`);--> statement-breakpoint
CREATE TABLE `oidc_authentication` (
	`cookie` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`state` text,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `oidc_authentication.expires` ON `oidc_authentication` (`expires`);--> statement-breakpoint
CREATE TABLE `passkeys` (
	`id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`display_name` text NOT NULL,
	`public_key` blob NOT NULL,
	`user_id` text NOT NULL,
	`webauthn_user_id` text NOT NULL,
	`counter` blob NOT NULL,
	`device_type` text NOT NULL,
	`backed_up` integer NOT NULL,
	`transports` text
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`cookie` text,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `registrations.expires` ON `registrations` (`expires`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`cookie` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`user_id` text NOT NULL,
	`last_used` integer NOT NULL,
	`last_location` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_public_id_unique` ON `sessions` (`public_id`);--> statement-breakpoint
CREATE INDEX `sessions.last_used` ON `sessions` (`last_used`);--> statement-breakpoint
CREATE TABLE `tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`last_used` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tokens.expires` ON `tokens` (`last_used`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_display_name_unique` ON `users` (`display_name`);