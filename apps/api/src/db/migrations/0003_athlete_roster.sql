ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'athlete' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
UPDATE "users" SET "role" = 'owner', "status" = 'approved';--> statement-breakpoint
DROP INDEX "users_one_account";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "singleton";--> statement-breakpoint
CREATE UNIQUE INDEX "users_one_owner" ON "users" USING btree ("role") WHERE "users"."role" = 'owner';
