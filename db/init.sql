CREATE DATABASE IF NOT EXISTS iot;
USE iot;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  passwordKey VARCHAR(6),
  reset_token VARCHAR(255) NULL,
  reset_token_expires DATETIME NULL
);

INSERT INTO users (username) VALUES 
('lockguard1');
