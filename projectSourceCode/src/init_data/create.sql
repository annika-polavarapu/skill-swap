-- Drop tables if they exist
DROP TABLE IF EXISTS expertise_levels;
DROP TABLE IF EXISTS skills_to_users;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS users;

-- User table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);


-- Skills table (predefined skills)
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) UNIQUE NOT NULL
);

-- Skills to users table (matches users to skills)
CREATE TABLE skills_to_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE
);

-- Expertise levels table (stores expertise levels for user-skill pairs)
CREATE TABLE expertise_levels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    expertise_level VARCHAR(20) CHECK (expertise_level IN ('novice', 'intermediate', 'advanced', 'expert', 'professional')) NOT NULL
);

-- Learning goal table (What the user wants to learn)
CREATE TABLE learning_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_name VARCHAR(100) NOT NULL,
    reason TEXT
);

-- Match table (Tracks users that have been matched together)
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user_1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed'))
);

-- Add a table to store profile pictures
CREATE TABLE profile_pictures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled event table
DROP TABLE IF EXISTS eventts;

CREATE TABLE IF NOT EXISTS eventts (
    id SERIAL PRIMARY KEY,
    schedday VARCHAR(100),
    eventname VARCHAR(100),
    modality VARCHAR(100),
    eventurl VARCHAR(100),
    eventlocation VARCHAR(100)
);

