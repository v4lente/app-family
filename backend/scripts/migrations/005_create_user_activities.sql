CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    family_id INTEGER REFERENCES families(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
