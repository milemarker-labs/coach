CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"sources" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "weighted_average_watts" double precision;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "max_watts" double precision;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "kilojoules" double precision;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "device_watts" boolean;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "has_heartrate" boolean;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "trainer" boolean;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "commute" boolean;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;