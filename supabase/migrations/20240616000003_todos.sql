-- Create todos table
CREATE TABLE todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  notes       TEXT NOT NULL DEFAULT '',
  due_date    DATE DEFAULT NULL,
  priority    INT NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 3),
  category    TEXT NOT NULL DEFAULT '',
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID NOT NULL DEFAULT auth.uid()
);

-- Indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_user_due ON todos(user_id, due_date) WHERE completed = FALSE;
CREATE INDEX idx_todos_user_completed ON todos(user_id, completed);

-- Auto-update updated_at on todos
CREATE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-set user_id on insert
CREATE OR REPLACE FUNCTION set_todo_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_todos_user_id_on_insert
  BEFORE INSERT ON todos
  FOR EACH ROW
  EXECUTE FUNCTION set_todo_user_id();

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- RLS policies for todos
CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- Cleanup function: delete todos older than 2 days
CREATE OR REPLACE FUNCTION cleanup_old_todos()
RETURNS void AS $$
BEGIN
  DELETE FROM todos
  WHERE created_at < NOW() - INTERVAL '2 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
