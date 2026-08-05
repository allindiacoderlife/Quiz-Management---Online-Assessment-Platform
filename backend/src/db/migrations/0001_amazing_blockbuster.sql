ALTER TABLE "users" ADD COLUMN "otp" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;