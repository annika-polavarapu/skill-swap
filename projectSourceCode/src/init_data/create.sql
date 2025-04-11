-- User table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Drop the existing skills table if it exists
DROP TABLE IF EXISTS skills;

-- Create the updated skills table
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id), -- NULL for predefined skills
    skill_name VARCHAR(100) NOT NULL,
    expertise_level VARCHAR(20) CHECK (expertise_level IN ('novice', 'intermediate', 'advanced', 'expert', 'professional')) DEFAULT NULL
);

-- Learning goal table (What the user wants to learn)
CREATE TABLE learning_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    goal_name VARCHAR(100) NOT NULL,
    reason TEXT
);

-- Match table (Tracks users that have been matched together)
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user_1_id INTEGER REFERENCES users(id),
    user_2_id INTEGER REFERENCES users(id),
    skill_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed'))
);

-- Add a table to store profile pictures
CREATE TABLE profile_pictures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS events;

-- Scheduled event table
CREATE TABLE IF NOT EXISTS events(
    id SERIAL PRIMARY KEY,
    schedday VARCHAR(100),
    eventname VARCHAR(100),
    modality VARCHAR(100),
    eventurl VARCHAR(100),
    eventlocation VARCHAR(100)
);

