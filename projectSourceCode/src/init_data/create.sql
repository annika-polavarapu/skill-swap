-- Drop tables if they exist
DROP TABLE IF EXISTS expertise_levels;
DROP TABLE IF EXISTS skills_to_users;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS learning_goals;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS messages;

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

-- Learning goals table (stores skills users want to learn)
CREATE TABLE IF NOT EXISTS learning_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match table (Tracks users that have been matched together)
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user_1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed'))
);

-- Profile pictures table
DROP TABLE IF EXISTS profile_pictures;

CREATE TABLE profile_pictures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Scheduled event table
DROP TABLE IF EXISTS events;

-- Scheduled event table
CREATE TABLE IF NOT EXISTS events(
    id SERIAL PRIMARY KEY,
    schedday VARCHAR(100),
    eventname VARCHAR(100),
    modality VARCHAR(100),
    eventurl VARCHAR(100),
    eventlocation VARCHAR(100),
    eventtime TIME,
    attendees VARCHAR(100)
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);