-- MySQL initialization script
-- Creates two separate databases and users as per architecture decision (PRD section 6.1):
-- - sakti_data: used by Django backend
-- - airflow_metadata: used by Apache Airflow
-- Both share the same MySQL instance but with separate credentials.

-- Create SAKTI data database
CREATE DATABASE IF NOT EXISTS sakti_data
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Create Airflow metadata database
CREATE DATABASE IF NOT EXISTS airflow_metadata
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Create sakti_app user (Django backend access)
CREATE USER IF NOT EXISTS 'sakti_app'@'%' IDENTIFIED BY '${MYSQL_DATA_PASSWORD}';
GRANT ALL PRIVILEGES ON sakti_data.* TO 'sakti_app'@'%';

-- Create airflow_app user (Airflow access)
CREATE USER IF NOT EXISTS 'airflow_app'@'%' IDENTIFIED BY '${MYSQL_AIRFLOW_PASSWORD}';
GRANT ALL PRIVILEGES ON airflow_metadata.* TO 'airflow_app'@'%';

-- Ensure sakti_app CANNOT access airflow_metadata and vice versa
-- (no grants needed — MySQL denies by default)

FLUSH PRIVILEGES;
