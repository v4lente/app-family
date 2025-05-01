CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_family_id ON user_activities(family_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_performed_at ON user_activities(performed_at);
