-- Create habits table
CREATE TABLE habits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '',
  frequency_type  TEXT NOT NULL DEFAULT 'daily'
                    CHECK (frequency_type IN ('daily', 'weekly', 'custom_days')),
  target_count    INT NOT NULL DEFAULT 1 CHECK (target_count >= 1 AND target_count <= 7),
  custom_days     INT[] NOT NULL DEFAULT '{}',
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_time   TIME DEFAULT NULL,
  archived        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id         UUID NOT NULL DEFAULT auth.uid()
);

-- Create habit_completions table
CREATE TABLE habit_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id      UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id       UUID NOT NULL DEFAULT auth.uid()
);

-- Unique constraint: one completion per habit per UTC day
CREATE UNIQUE INDEX idx_one_completion_per_day
  ON habit_completions (habit_id, (completed_at::date));

-- Indexes
CREATE INDEX idx_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_completions_date ON habit_completions(completed_at);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_completions_user_id ON habit_completions(user_id);
CREATE INDEX idx_habits_archived ON habits(archived) WHERE archived = FALSE;
CREATE INDEX idx_habits_category ON habits(category);

-- Auto-update updated_at on habits
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-set user_id on insert
CREATE OR REPLACE FUNCTION set_habit_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_habits_user_id_on_insert
  BEFORE INSERT ON habits
  FOR EACH ROW
  EXECUTE FUNCTION set_habit_user_id();

CREATE OR REPLACE FUNCTION set_completion_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_completions_user_id_on_insert
  BEFORE INSERT ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION set_completion_user_id();

-- Enable RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for habits
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for completions
CREATE POLICY "Users can view own completions" ON habit_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own completions" ON habit_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON habit_completions
  FOR DELETE USING (auth.uid() = user_id);
