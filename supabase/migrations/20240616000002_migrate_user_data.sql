CREATE OR REPLACE FUNCTION migrate_user_data(old_user_id UUID, new_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE habits SET user_id = new_user_id WHERE user_id = old_user_id;
  UPDATE habit_completions SET user_id = new_user_id WHERE user_id = old_user_id;
END;
$$;
