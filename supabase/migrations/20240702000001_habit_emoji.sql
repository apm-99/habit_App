-- Add emoji column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '';

-- Backfill emoji from category for existing habits
UPDATE habits SET emoji = CASE category
  WHEN 'health' THEN '❤️'
  WHEN 'fitness' THEN '🏃'
  WHEN 'learning' THEN '📖'
  WHEN 'mindfulness' THEN '🧘'
  WHEN 'work' THEN '💻'
  WHEN 'social' THEN '🤝'
  WHEN 'finance' THEN '💰'
  ELSE '📋'
END
WHERE emoji = '' OR emoji IS NULL;
