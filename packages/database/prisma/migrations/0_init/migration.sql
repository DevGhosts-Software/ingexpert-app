-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_graphql";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "supabase_vault";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "CardState" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING', 'SUSPENDED', 'BURIED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "card_learning_paths" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "card_sequence" TEXT[],
    "concept" TEXT,
    "concept_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "mastered_at" TIMESTAMP(3),
    "initial_difficulty" DOUBLE PRECISION,
    "final_difficulty" DOUBLE PRECISION,
    "recommended_next_concept" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_anomalies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "card_id" TEXT,
    "deck_id" TEXT,
    "description" TEXT NOT NULL,
    "metric" DOUBLE PRECISION,
    "expected_range" TEXT,
    "ai_suggestion" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_taken" BOOLEAN NOT NULL DEFAULT false,
    "action_taken_at" TIMESTAMP(3),
    "success" BOOLEAN,
    "metric" TEXT,
    "before_value" DOUBLE PRECISION,
    "after_value" DOUBLE PRECISION,
    "generatedBy" TEXT NOT NULL DEFAULT 'claude-3.5-sonnet',
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluated_at" TIMESTAMP(3),

    CONSTRAINT "study_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_concept_id" TEXT,
    "deck_id" TEXT,
    "card_ids" TEXT[],
    "mastery_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimated_difficulty" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_card_generations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "prompt" TEXT,
    "source_url" TEXT,
    "cards_generated" INTEGER NOT NULL DEFAULT 0,
    "card_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "average_quality_score" DOUBLE PRECISION,
    "user_approved_count" INTEGER NOT NULL DEFAULT 0,
    "user_rejected_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "model" TEXT NOT NULL DEFAULT 'claude-3.5-sonnet',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DOUBLE PRECISION,
    "parent_generation_id" TEXT,
    "regeneration_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_card_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_feedback" (
    "id" TEXT NOT NULL,
    "generation_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "was_approved" BOOLEAN NOT NULL,
    "issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cards_reviewed" INTEGER NOT NULL DEFAULT 0,
    "cards_correct" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION,
    "total_time_ms" INTEGER NOT NULL DEFAULT 0,
    "new_cards_added" INTEGER NOT NULL DEFAULT 0,
    "average_confidence" DOUBLE PRECISION,
    "guess_rate" DOUBLE PRECISION,
    "avg_stability_before" DOUBLE PRECISION,
    "avg_stability_after" DOUBLE PRECISION,
    "avg_difficulty_before" DOUBLE PRECISION,
    "correct_by_rating" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_daily_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cards_reviewed" INTEGER NOT NULL DEFAULT 0,
    "cards_correct" INTEGER NOT NULL DEFAULT 0,
    "new_cards_added" INTEGER NOT NULL DEFAULT 0,
    "total_time_ms" INTEGER NOT NULL DEFAULT 0,
    "new_count" INTEGER NOT NULL DEFAULT 0,
    "learning_count" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "relearning_count" INTEGER NOT NULL DEFAULT 0,
    "maturation_rate" DOUBLE PRECISION,
    "due_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deck_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_performance_summaries" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "correct_reviews" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "recent_reviews" INTEGER NOT NULL DEFAULT 0,
    "recent_correct" INTEGER NOT NULL DEFAULT 0,
    "recent_accuracy" DOUBLE PRECISION,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "avg_confidence" DOUBLE PRECISION,
    "avg_review_time_ms" INTEGER,
    "last_reviewed_at" TIMESTAMP(3),
    "varianceInRating" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_performance_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "template_id" TEXT,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "markdown" BOOLEAN NOT NULL DEFAULT false,
    "front_media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "back_media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_fields" JSONB NOT NULL DEFAULT '{}',
    "state" "CardState" NOT NULL DEFAULT 'NEW',
    "due" TIMESTAMP(3) NOT NULL,
    "stability" DOUBLE PRECISION,
    "difficulty" DOUBLE PRECISION,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "flag" INTEGER NOT NULL DEFAULT 0,
    "leech" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "sibling_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "first_reviewed_at" TIMESTAMP(3),
    "last_reviewed_at" TIMESTAMP(3),

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "front_template" TEXT NOT NULL,
    "back_template" TEXT NOT NULL,
    "field_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "css" TEXT,
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_notes" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_histories" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state_before" "CardState" NOT NULL,
    "state_after" "CardState" NOT NULL,
    "stability_before" DOUBLE PRECISION,
    "stability_after" DOUBLE PRECISION,
    "difficulty_before" DOUBLE PRECISION,
    "difficulty_after" DOUBLE PRECISION,
    "rating" INTEGER NOT NULL,
    "review_time_ms" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_interleaving_groups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strategyType" TEXT NOT NULL DEFAULT 'spaced',
    "maxSimultaneous" INTEGER NOT NULL DEFAULT 3,
    "card_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_interleaving_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_embeddings" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "summary" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "token_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "desired_retention" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "leech_threshold" INTEGER NOT NULL DEFAULT 8,
    "deck_options" JSONB NOT NULL DEFAULT '{}',
    "new_cards_limit" INTEGER NOT NULL DEFAULT 20,
    "review_cards_limit" INTEGER NOT NULL DEFAULT 200,
    "icon" TEXT DEFAULT '📚',
    "color" TEXT DEFAULT '#3B82F6',
    "parent_id" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "card_count" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "due_count" INTEGER NOT NULL DEFAULT 0,
    "total_learning_time" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_reviewed_at" TIMESTAMP(3),
    "collectionId" TEXT,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_histories" (
    "id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cards_added" INTEGER NOT NULL DEFAULT 0,
    "cards_removed" INTEGER NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deck_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_decks" (
    "id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "share_code" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "allow_download" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT '📁',
    "color" TEXT DEFAULT '#8B5CF6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "card_state" "CardState" NOT NULL,
    "review_time_ms" INTEGER NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userConfidence" INTEGER,
    "wasGuess" BOOLEAN NOT NULL DEFAULT false,
    "contextNotes" TEXT,
    "deviceType" TEXT,
    "connectionType" TEXT,
    "stability_after" DOUBLE PRECISION,
    "difficulty_after" DOUBLE PRECISION,
    "interval_days" INTEGER,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "cards_reviewed" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "total_time_ms" INTEGER NOT NULL DEFAULT 0,
    "platform" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "name" TEXT,
    "avatar" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "preferred_retention" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_cards" INTEGER NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "total_decks" INTEGER NOT NULL DEFAULT 0,
    "total_study_time" INTEGER NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "last_review_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "learningStyle" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredDailyGoal" INTEGER NOT NULL DEFAULT 30,
    "preferredCardsPerDay" INTEGER NOT NULL DEFAULT 50,
    "studyTimeOfDay" TEXT NOT NULL DEFAULT 'morning',
    "nativeLanguage" TEXT NOT NULL DEFAULT 'en',
    "proficiencyLevel" TEXT NOT NULL DEFAULT 'intermediate',
    "contentDifficultyTarget" TEXT NOT NULL DEFAULT 'challenging',
    "use_ai_hints" BOOLEAN NOT NULL DEFAULT true,
    "aiHintAggressiveness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CardToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CardToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "card_learning_paths_user_id_concept_idx" ON "card_learning_paths"("user_id", "concept");

-- CreateIndex
CREATE INDEX "card_learning_paths_user_id_mastered_idx" ON "card_learning_paths"("user_id", "mastered");

-- CreateIndex
CREATE INDEX "learning_anomalies_user_id_type_idx" ON "learning_anomalies"("user_id", "type");

-- CreateIndex
CREATE INDEX "learning_anomalies_user_id_created_at_idx" ON "learning_anomalies"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "study_recommendations_user_id_action_taken_idx" ON "study_recommendations"("user_id", "action_taken");

-- CreateIndex
CREATE INDEX "study_recommendations_user_id_success_idx" ON "study_recommendations"("user_id", "success");

-- CreateIndex
CREATE INDEX "concepts_user_id_mastery_score_idx" ON "concepts"("user_id", "mastery_score");

-- CreateIndex
CREATE UNIQUE INDEX "concepts_user_id_name_key" ON "concepts"("user_id", "name");

-- CreateIndex
CREATE INDEX "ai_card_generations_user_id_created_at_idx" ON "ai_card_generations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_card_generations_status_idx" ON "ai_card_generations"("status");

-- CreateIndex
CREATE INDEX "ai_card_generations_deck_id_idx" ON "ai_card_generations"("deck_id");

-- CreateIndex
CREATE INDEX "ai_generation_feedback_generation_id_idx" ON "ai_generation_feedback"("generation_id");

-- CreateIndex
CREATE INDEX "ai_generation_feedback_card_id_idx" ON "ai_generation_feedback"("card_id");

-- CreateIndex
CREATE INDEX "user_daily_stats_user_id_date_idx" ON "user_daily_stats"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_stats_user_id_date_key" ON "user_daily_stats"("user_id", "date");

-- CreateIndex
CREATE INDEX "deck_daily_stats_deck_id_date_idx" ON "deck_daily_stats"("deck_id", "date");

-- CreateIndex
CREATE INDEX "deck_daily_stats_user_id_deck_id_date_idx" ON "deck_daily_stats"("user_id", "deck_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "deck_daily_stats_deck_id_date_key" ON "deck_daily_stats"("deck_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "card_performance_summaries_card_id_key" ON "card_performance_summaries"("card_id");

-- CreateIndex
CREATE INDEX "card_performance_summaries_user_id_difficulty_idx" ON "card_performance_summaries"("user_id", "difficulty");

-- CreateIndex
CREATE INDEX "card_performance_summaries_user_id_successRate_idx" ON "card_performance_summaries"("user_id", "successRate");

-- CreateIndex
CREATE INDEX "cards_user_id_deck_id_idx" ON "cards"("user_id", "deck_id");

-- CreateIndex
CREATE INDEX "cards_user_id_due_idx" ON "cards"("user_id", "due");

-- CreateIndex
CREATE INDEX "cards_deck_id_state_idx" ON "cards"("deck_id", "state");

-- CreateIndex
CREATE INDEX "cards_user_id_last_reviewed_at_idx" ON "cards"("user_id", "last_reviewed_at");

-- CreateIndex
CREATE INDEX "cards_leech_idx" ON "cards"("leech");

-- CreateIndex
CREATE INDEX "cards_sibling_id_idx" ON "cards"("sibling_id");

-- CreateIndex
CREATE INDEX "cards_user_id_is_archived_idx" ON "cards"("user_id", "is_archived");

-- CreateIndex
CREATE INDEX "cards_user_id_deck_id_state_idx" ON "cards"("user_id", "deck_id", "state");

-- CreateIndex
CREATE INDEX "cards_user_id_due_state_idx" ON "cards"("user_id", "due", "state");

-- CreateIndex
CREATE INDEX "cards_deck_id_due_state_idx" ON "cards"("deck_id", "due", "state");

-- CreateIndex
CREATE INDEX "card_templates_user_id_idx" ON "card_templates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_templates_user_id_name_key" ON "card_templates"("user_id", "name");

-- CreateIndex
CREATE INDEX "card_notes_card_id_idx" ON "card_notes"("card_id");

-- CreateIndex
CREATE INDEX "card_notes_user_id_idx" ON "card_notes"("user_id");

-- CreateIndex
CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_name_key" ON "tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "card_histories_card_id_timestamp_idx" ON "card_histories"("card_id", "timestamp");

-- CreateIndex
CREATE INDEX "card_histories_user_id_timestamp_idx" ON "card_histories"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "card_interleaving_groups_user_id_deck_id_idx" ON "card_interleaving_groups"("user_id", "deck_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_embeddings_card_id_key" ON "card_embeddings"("card_id");

-- CreateIndex
CREATE INDEX "card_embeddings_card_id_idx" ON "card_embeddings"("card_id");

-- CreateIndex
CREATE INDEX "decks_user_id_idx" ON "decks"("user_id");

-- CreateIndex
CREATE INDEX "decks_parent_id_idx" ON "decks"("parent_id");

-- CreateIndex
CREATE INDEX "decks_user_id_created_at_idx" ON "decks"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "decks_user_id_name_key" ON "decks"("user_id", "name");

-- CreateIndex
CREATE INDEX "deck_histories_deck_id_date_idx" ON "deck_histories"("deck_id", "date");

-- CreateIndex
CREATE INDEX "deck_histories_user_id_date_idx" ON "deck_histories"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "shared_decks_share_code_key" ON "shared_decks"("share_code");

-- CreateIndex
CREATE INDEX "shared_decks_share_code_idx" ON "shared_decks"("share_code");

-- CreateIndex
CREATE INDEX "shared_decks_user_id_idx" ON "shared_decks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_decks_deck_id_key" ON "shared_decks"("deck_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "collections_user_id_idx" ON "collections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "collections_user_id_name_key" ON "collections"("user_id", "name");

-- CreateIndex
CREATE INDEX "reviews_card_id_idx" ON "reviews"("card_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_reviewed_at_idx" ON "reviews"("user_id", "reviewed_at");

-- CreateIndex
CREATE INDEX "reviews_deck_id_reviewed_at_idx" ON "reviews"("deck_id", "reviewed_at");

-- CreateIndex
CREATE INDEX "reviews_reviewed_at_idx" ON "reviews"("reviewed_at");

-- CreateIndex
CREATE INDEX "reviews_user_id_reviewed_at_rating_idx" ON "reviews"("user_id", "reviewed_at", "rating");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_started_at_idx" ON "study_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "study_sessions_deck_id_started_at_idx" ON "study_sessions"("deck_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_user_id_key" ON "user_stats"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_learning_profiles_user_id_key" ON "user_learning_profiles"("user_id");

-- CreateIndex
CREATE INDEX "_CardToTag_B_index" ON "_CardToTag"("B");

-- AddForeignKey
ALTER TABLE "card_learning_paths" ADD CONSTRAINT "card_learning_paths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_learning_paths" ADD CONSTRAINT "card_learning_paths_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_anomalies" ADD CONSTRAINT "learning_anomalies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_recommendations" ADD CONSTRAINT "study_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_parent_concept_id_fkey" FOREIGN KEY ("parent_concept_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_feedback" ADD CONSTRAINT "ai_generation_feedback_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "ai_card_generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_stats" ADD CONSTRAINT "user_daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_daily_stats" ADD CONSTRAINT "deck_daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_daily_stats" ADD CONSTRAINT "deck_daily_stats_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_performance_summaries" ADD CONSTRAINT "card_performance_summaries_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_performance_summaries" ADD CONSTRAINT "card_performance_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "card_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_templates" ADD CONSTRAINT "card_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_notes" ADD CONSTRAINT "card_notes_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_histories" ADD CONSTRAINT "card_histories_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_histories" ADD CONSTRAINT "card_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_embeddings" ADD CONSTRAINT "card_embeddings_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_histories" ADD CONSTRAINT "deck_histories_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_decks" ADD CONSTRAINT "shared_decks_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_decks" ADD CONSTRAINT "shared_decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_profiles" ADD CONSTRAINT "user_learning_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardToTag" ADD CONSTRAINT "_CardToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardToTag" ADD CONSTRAINT "_CardToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

