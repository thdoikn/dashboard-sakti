#!/bin/bash
# MySQL initialization script for SAKTI-OIKN
# Creates two separate databases and app users with separate credentials.
# Runs automatically on first container start (docker-entrypoint-initdb.d).
# Shell scripts have access to container env vars; .sql files do not.

set -e

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    -- SAKTI data database (used by Django backend)
    CREATE DATABASE IF NOT EXISTS sakti_data
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;

    -- Airflow metadata database (used by Apache Airflow)
    CREATE DATABASE IF NOT EXISTS airflow_metadata
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;

    -- Django backend app user — sakti_data only
    CREATE USER IF NOT EXISTS 'sakti_app'@'%' IDENTIFIED BY '${MYSQL_DATA_PASSWORD}';
    GRANT ALL PRIVILEGES ON sakti_data.* TO 'sakti_app'@'%';

    -- Airflow app user — airflow_metadata only
    CREATE USER IF NOT EXISTS 'airflow_app'@'%' IDENTIFIED BY '${MYSQL_AIRFLOW_PASSWORD}';
    GRANT ALL PRIVILEGES ON airflow_metadata.* TO 'airflow_app'@'%';

    FLUSH PRIVILEGES;
EOSQL

echo "[sakti-init] Databases and users created successfully."
