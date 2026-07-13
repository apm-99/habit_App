-- GYM TRACKER — Clean migration (no legacy references)
-- Run in Supabase SQL Editor

-- New tables (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT auth.uid()
);

CREATE TABLE IF NOT EXISTS split_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT auth.uid()
);

CREATE TABLE IF NOT EXISTS split_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES split_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  target_sets INT NOT NULL DEFAULT 3 CHECK (target_sets >= 1 AND target_sets <= 20),
  target_reps_min INT NOT NULL DEFAULT 8 CHECK (target_reps_min >= 1 AND target_reps_min <= 100),
  target_reps_max INT NOT NULL DEFAULT 12 CHECK (target_reps_max >= 1 AND target_reps_max <= 100),
  rest_seconds INT NOT NULL DEFAULT 90 CHECK (rest_seconds >= 0 AND rest_seconds <= 600),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT auth.uid()
);

-- Existing tables — add missing columns
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS day_id UUID REFERENCES split_days(id) ON DELETE SET NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_splits_user_id ON splits(user_id);
CREATE INDEX IF NOT EXISTS idx_split_days_split_id ON split_days(split_id);
CREATE INDEX IF NOT EXISTS idx_split_day_exercises_day_id ON split_day_exercises(day_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id ON workout_session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_day_id ON workout_sessions(day_id);
CREATE INDEX IF NOT EXISTS idx_sets_session_id ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON exercise_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_exercise_id ON exercise_history(exercise_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_workout_user_id()
RETURNS TRIGGER AS $$ BEGIN NEW.user_id = auth.uid(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION populate_exercise_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO exercise_history (user_id, exercise_id, session_id, workout_date, weight, reps, is_warmup, is_pr, estimated_1rm)
  SELECT NEW.user_id, NEW.exercise_id, NEW.session_id, s.started_at::date, NEW.weight, NEW.reps, NEW.is_warmup, FALSE,
    CASE WHEN NEW.reps > 0 THEN ROUND((NEW.weight * (1 + NEW.reps / 30.0))::numeric, 2) ELSE 0 END
  FROM workout_sessions s WHERE s.id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS set_splits_updated_at ON splits;
CREATE TRIGGER set_splits_updated_at BEFORE UPDATE ON splits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_splits_user_id ON splits;
CREATE TRIGGER set_splits_user_id BEFORE INSERT ON splits FOR EACH ROW EXECUTE FUNCTION set_workout_user_id();
DROP TRIGGER IF EXISTS set_split_days_user_id ON split_days;
CREATE TRIGGER set_split_days_user_id BEFORE INSERT ON split_days FOR EACH ROW EXECUTE FUNCTION set_workout_user_id();
DROP TRIGGER IF EXISTS set_split_day_exercises_user_id ON split_day_exercises;
CREATE TRIGGER set_split_day_exercises_user_id BEFORE INSERT ON split_day_exercises FOR EACH ROW EXECUTE FUNCTION set_workout_user_id();
DROP TRIGGER IF EXISTS set_sessions_user_id ON workout_sessions;
CREATE TRIGGER set_sessions_user_id BEFORE INSERT ON workout_sessions FOR EACH ROW EXECUTE FUNCTION set_workout_user_id();
DROP TRIGGER IF EXISTS set_session_exercises_user_id ON workout_session_exercises;
CREATE TRIGGER set_session_exercises_user_id BEFORE INSERT ON workout_session_exercises FOR EACH ROW EXECUTE FUNCTION set_workout_user_id();
DROP TRIGGER IF EXISTS set_sets_user_id ON workout_sets;
CREATE TRIGGER set_sets_user_id BEFORE INSERT ON workout_sets FOR EACH ROW EXECUTE FUNCTION set_workout_user_id();
DROP TRIGGER IF EXISTS set_history_user_id ON exercise_history;
CREATE TRIGGER set_history_user_id BEFORE INSERT ON exercise_history FOR EACH ROW EXECUTE FUNCTION set_workout_user_id();
DROP TRIGGER IF EXISTS trigger_populate_exercise_history ON workout_sets;
CREATE TRIGGER trigger_populate_exercise_history AFTER INSERT ON workout_sets FOR EACH ROW EXECUTE FUNCTION populate_exercise_history();

-- RLS
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View muscle groups" ON muscle_groups;
CREATE POLICY "View muscle groups" ON muscle_groups FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Create custom muscle groups" ON muscle_groups;
CREATE POLICY "Create custom muscle groups" ON muscle_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "View exercises" ON exercises;
CREATE POLICY "View exercises" ON exercises FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Create exercises" ON exercises;
CREATE POLICY "Create exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update exercises" ON exercises;
CREATE POLICY "Update exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Delete exercises" ON exercises;
CREATE POLICY "Delete exercises" ON exercises FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "View splits" ON splits;
CREATE POLICY "View splits" ON splits FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create splits" ON splits;
CREATE POLICY "Create splits" ON splits FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update splits" ON splits;
CREATE POLICY "Update splits" ON splits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Delete splits" ON splits;
CREATE POLICY "Delete splits" ON splits FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "View split days" ON split_days;
CREATE POLICY "View split days" ON split_days FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Manage split days" ON split_days;
CREATE POLICY "Manage split days" ON split_days FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "View split day exercises" ON split_day_exercises;
CREATE POLICY "View split day exercises" ON split_day_exercises FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Manage split day exercises" ON split_day_exercises;
CREATE POLICY "Manage split day exercises" ON split_day_exercises FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "View sessions" ON workout_sessions;
CREATE POLICY "View sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create sessions" ON workout_sessions;
CREATE POLICY "Create sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update sessions" ON workout_sessions;
CREATE POLICY "Update sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Delete sessions" ON workout_sessions;
CREATE POLICY "Delete sessions" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "View session exercises" ON workout_session_exercises;
CREATE POLICY "View session exercises" ON workout_session_exercises FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Manage session exercises" ON workout_session_exercises;
CREATE POLICY "Manage session exercises" ON workout_session_exercises FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "View sets" ON workout_sets;
CREATE POLICY "View sets" ON workout_sets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Manage sets" ON workout_sets;
CREATE POLICY "Manage sets" ON workout_sets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "View history" ON exercise_history;
CREATE POLICY "View history" ON exercise_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create history" ON exercise_history;
CREATE POLICY "Create history" ON exercise_history FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Delete history" ON exercise_history;
CREATE POLICY "Delete history" ON exercise_history FOR DELETE USING (auth.uid() = user_id);

-- Seed muscle groups
INSERT INTO muscle_groups (name, category) VALUES
  ('Chest', 'chest'), ('Front Delts', 'chest'), ('Side Delts', 'shoulders'),
  ('Rear Delts', 'shoulders'), ('Traps', 'back'), ('Lats', 'back'),
  ('Rhomboids', 'back'), ('Lower Back', 'back'), ('Biceps', 'arms'),
  ('Triceps', 'arms'), ('Forearms', 'arms'), ('Quadriceps', 'legs'),
  ('Hamstrings', 'legs'), ('Glutes', 'legs'), ('Calves', 'legs'),
  ('Adductors', 'legs'), ('Abductors', 'legs'), ('Abs', 'core'),
  ('Obliques', 'core'), ('Hip Flexors', 'core'), ('Serratus Anterior', 'chest')
ON CONFLICT (name) DO NOTHING;

-- Seed exercises
INSERT INTO exercises (name, primary_muscle, secondary_muscles, category, is_custom) VALUES
  ('Barbell Bench Press', 'Chest', ARRAY['Front Delts', 'Triceps'], 'compound', FALSE),
  ('Incline Barbell Bench Press', 'Chest', ARRAY['Front Delts', 'Triceps'], 'compound', FALSE),
  ('Dumbbell Bench Press', 'Chest', ARRAY['Front Delts', 'Triceps'], 'compound', FALSE),
  ('Incline Dumbbell Press', 'Chest', ARRAY['Front Delts', 'Triceps'], 'compound', FALSE),
  ('Dumbbell Fly', 'Chest', ARRAY['Front Delts'], 'isolation', FALSE),
  ('Cable Fly', 'Chest', ARRAY['Front Delts'], 'isolation', FALSE),
  ('Pec Deck Machine', 'Chest', ARRAY['Front Delts'], 'isolation', FALSE),
  ('Machine Chest Press', 'Chest', ARRAY['Front Delts', 'Triceps'], 'compound', FALSE),
  ('Chest Dip', 'Chest', ARRAY['Front Delts', 'Triceps'], 'compound', FALSE),
  ('Push Up', 'Chest', ARRAY['Front Delts', 'Triceps', 'Core'], 'compound', FALSE),
  ('Barbell Row', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Traps'], 'compound', FALSE),
  ('Deadlift', 'Lower Back', ARRAY['Hamstrings', 'Glutes', 'Traps', 'Forearms'], 'compound', FALSE),
  ('Romanian Deadlift', 'Hamstrings', ARRAY['Glutes', 'Lower Back'], 'compound', FALSE),
  ('Pull Up', 'Lats', ARRAY['Biceps', 'Rear Delts'], 'compound', FALSE),
  ('Lat Pulldown', 'Lats', ARRAY['Biceps', 'Rear Delts'], 'compound', FALSE),
  ('Seated Cable Row', 'Lats', ARRAY['Biceps', 'Rhomboids'], 'compound', FALSE),
  ('T-Bar Row', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Traps'], 'compound', FALSE),
  ('Face Pull', 'Rear Delts', ARRAY['Traps', 'Rotator Cuff'], 'isolation', FALSE),
  ('Barbell Shrug', 'Traps', ARRAY['Forearms'], 'isolation', FALSE),
  ('Good Morning', 'Lower Back', ARRAY['Hamstrings', 'Glutes'], 'compound', FALSE),
  ('Overhead Press', 'Side Delts', ARRAY['Front Delts', 'Triceps', 'Core'], 'compound', FALSE),
  ('Dumbbell Shoulder Press', 'Side Delts', ARRAY['Front Delts', 'Triceps'], 'compound', FALSE),
  ('Arnold Press', 'Side Delts', ARRAY['Front Delts', 'Triceps'], 'compound', FALSE),
  ('Dumbbell Lateral Raise', 'Side Delts', ARRAY[]::text[], 'isolation', FALSE),
  ('Cable Lateral Raise', 'Side Delts', ARRAY[]::text[], 'isolation', FALSE),
  ('Front Raise', 'Front Delts', ARRAY[]::text[], 'isolation', FALSE),
  ('Rear Delt Fly', 'Rear Delts', ARRAY[]::text[], 'isolation', FALSE),
  ('Barbell Curl', 'Biceps', ARRAY['Forearms'], 'isolation', FALSE),
  ('Dumbbell Curl', 'Biceps', ARRAY['Forearms'], 'isolation', FALSE),
  ('Hammer Curl', 'Biceps', ARRAY['Forearms'], 'isolation', FALSE),
  ('Preacher Curl', 'Biceps', ARRAY[]::text[], 'isolation', FALSE),
  ('Cable Curl', 'Biceps', ARRAY[]::text[], 'isolation', FALSE),
  ('Triceps Pushdown', 'Triceps', ARRAY[]::text[], 'isolation', FALSE),
  ('Overhead Tricep Extension', 'Triceps', ARRAY[]::text[], 'isolation', FALSE),
  ('Skull Crusher', 'Triceps', ARRAY[]::text[], 'isolation', FALSE),
  ('Close Grip Bench Press', 'Triceps', ARRAY['Chest', 'Front Delts'], 'compound', FALSE),
  ('Dip', 'Triceps', ARRAY['Chest', 'Front Delts'], 'compound', FALSE),
  ('Barbell Back Squat', 'Quadriceps', ARRAY['Glutes', 'Hamstrings', 'Core'], 'compound', FALSE),
  ('Front Squat', 'Quadriceps', ARRAY['Glutes', 'Core'], 'compound', FALSE),
  ('Goblet Squat', 'Quadriceps', ARRAY['Glutes', 'Core'], 'compound', FALSE),
  ('Leg Press', 'Quadriceps', ARRAY['Glutes'], 'compound', FALSE),
  ('Hack Squat', 'Quadriceps', ARRAY['Glutes'], 'compound', FALSE),
  ('Leg Extension', 'Quadriceps', ARRAY[]::text[], 'isolation', FALSE),
  ('Bulgarian Split Squat', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], 'compound', FALSE),
  ('Walking Lunge', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], 'compound', FALSE),
  ('Lying Leg Curl', 'Hamstrings', ARRAY[]::text[], 'isolation', FALSE),
  ('Seated Leg Curl', 'Hamstrings', ARRAY[]::text[], 'isolation', FALSE),
  ('Nordic Hamstring Curl', 'Hamstrings', ARRAY[]::text[], 'isolation', FALSE),
  ('Hip Thrust', 'Glutes', ARRAY['Hamstrings'], 'compound', FALSE),
  ('Barbell Hip Thrust', 'Glutes', ARRAY['Hamstrings'], 'compound', FALSE),
  ('Glute Bridge', 'Glutes', ARRAY['Hamstrings'], 'isolation', FALSE),
  ('Cable Pull Through', 'Glutes', ARRAY['Hamstrings'], 'isolation', FALSE),
  ('Sumo Deadlift', 'Glutes', ARRAY['Quadriceps', 'Hamstrings', 'Adductors'], 'compound', FALSE),
  ('Standing Calf Raise', 'Calves', ARRAY[]::text[], 'isolation', FALSE),
  ('Seated Calf Raise', 'Calves', ARRAY[]::text[], 'isolation', FALSE),
  ('Cable Crunch', 'Abs', ARRAY[]::text[], 'isolation', FALSE),
  ('Hanging Leg Raise', 'Abs', ARRAY['Hip Flexors', 'Obliques'], 'isolation', FALSE),
  ('Ab Rollout', 'Abs', ARRAY['Obliques', 'Core'], 'isolation', FALSE),
  ('Plank', 'Abs', ARRAY['Obliques', 'Core'], 'isolation', FALSE),
  ('Side Plank', 'Obliques', ARRAY[]::text[], 'isolation', FALSE),
  ('Dead Bug', 'Abs', ARRAY['Core'], 'isolation', FALSE),
  ('Russian Twist', 'Obliques', ARRAY[]::text[], 'isolation', FALSE),
  ('Farmers Walk', 'Forearms', ARRAY['Traps', 'Core'], 'compound', FALSE),
  ('Dead Hang', 'Forearms', ARRAY[]::text[], 'isolation', FALSE)
ON CONFLICT DO NOTHING;
