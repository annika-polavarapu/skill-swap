-- Lines 1-35 written by Evan, ask for clarification if anything's confusing
-- User table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Skill Table (What the user can teach/share)
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    skill_name VARCHAR(100) NOT NULL,
    expertise_level INTEGER CHECK (expertise_level BETWEEN 1 AND 5),
    experience_years INTEGER,
    motivation TEXT
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



-- Scheduled event table
CREATE TABLE scheduledevents (
    id SERIAL PRIMARY KEY,
    scheduledday VARCHAR(100) NOT NULL
);

