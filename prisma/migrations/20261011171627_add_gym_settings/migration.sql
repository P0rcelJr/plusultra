-- CreateTable
CREATE TABLE "gym_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "booking_window_days" INTEGER NOT NULL DEFAULT 7,
    "cancel_deadline_hours" INTEGER NOT NULL DEFAULT 2,
    "materialize_horizon_weeks" INTEGER NOT NULL DEFAULT 4,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gym_settings_pkey" PRIMARY KEY ("id")
);
