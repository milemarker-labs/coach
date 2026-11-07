CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"strava_activity_id" bigint NOT NULL,
	"name" text,
	"sport_type" text,
	"activity_type" text,
	"start_date" timestamp with time zone NOT NULL,
	"start_date_local" timestamp,
	"distance" double precision,
	"moving_time" integer,
	"elapsed_time" integer,
	"total_elevation_gain" double precision,
	"average_speed" double precision,
	"max_speed" double precision,
	"average_heartrate" double precision,
	"max_heartrate" double precision,
	"average_cadence" double precision,
	"average_watts" double precision,
	"calories" double precision,
	"suffer_score" integer,
	"average_temp" double precision,
	"gear_id" text,
	"raw_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strava_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"athlete_id" bigint NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scope" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "strava_connections_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_type" text NOT NULL,
	"status" text NOT NULL,
	"cursor" jsonb,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"retry_after" timestamp with time zone,
	"lease_until" timestamp with time zone,
	"error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"user_id" uuid NOT NULL,
	"job_type" text NOT NULL,
	"page" integer,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"read_rate_usage" text,
	"read_rate_limit" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text,
	"strava_athlete_id" bigint NOT NULL,
	"singleton" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strava_connections" ADD CONSTRAINT "strava_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_job_id_sync_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."sync_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_user_strava_id" ON "activities" USING btree ("user_id","strava_activity_id");--> statement-breakpoint
CREATE INDEX "idx_activities_user_date" ON "activities" USING btree ("user_id","start_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_activities_sport_date" ON "activities" USING btree ("user_id","sport_type","start_date" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "sync_jobs_one_active" ON "sync_jobs" USING btree ("user_id") WHERE "sync_jobs"."status" in ('pending', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "users_strava_athlete_id" ON "users" USING btree ("strava_athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_one_account" ON "users" USING btree ("singleton");