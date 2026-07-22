CREATE TABLE "answer_records" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer,
	"question_id" varchar(32) NOT NULL,
	"user_answer" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"mode" varchar(32) NOT NULL,
	"subject_id" varchar(32),
	"subject_name" varchar(128),
	"created_at" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorite_records" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer,
	"question_id" varchar(32) NOT NULL,
	"created_at" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"type" varchar(32) NOT NULL,
	"options" json,
	"answer" text NOT NULL,
	"analysis" text,
	"difficulty" varchar(32) DEFAULT 'easy',
	"subject_id" varchar(32) NOT NULL,
	"subject_name" varchar(128) NOT NULL,
	"year" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_stats" (
	"user_id" integer,
	"subject_id" varchar(32),
	"total" integer DEFAULT 0,
	"correct" integer DEFAULT 0,
	"accuracy" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subject_stats_user_id_subject_id_pk" PRIMARY KEY("user_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"icon" varchar(64),
	"question_count" integer DEFAULT 0,
	"color" varchar(32),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"today_count" integer DEFAULT 0,
	"total_questions" integer DEFAULT 0,
	"total_correct" integer DEFAULT 0,
	"streak" integer DEFAULT 0,
	"total_days" integer DEFAULT 0,
	"last_study_date" date,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openid" varchar(128),
	"nick_name" varchar(128),
	"avatar_url" varchar(512),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_openid_unique" UNIQUE("openid")
);
--> statement-breakpoint
ALTER TABLE "answer_records" ADD CONSTRAINT "answer_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_records" ADD CONSTRAINT "answer_records_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_records" ADD CONSTRAINT "favorite_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_records" ADD CONSTRAINT "favorite_records_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_stats" ADD CONSTRAINT "subject_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_stats" ADD CONSTRAINT "subject_stats_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;