# Airflow Dockerfile
# Extends official Apache Airflow image and adds project-specific dependencies:
# - Django (for direct ORM access to sakti_data, per CLAUDE.md Option A)
# - mysqlclient (MySQL driver)
# - sakti_client (shared Python module)

FROM apache/airflow:2.9.3

USER root

# Install system dependencies for mysqlclient
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    && rm -rf /var/lib/apt/lists/*

USER airflow

# Install extra Python dependencies
COPY requirements.txt /requirements-extra.txt
RUN pip install --no-cache-dir -r /requirements-extra.txt

# Mount point for the Django app code (shared via volume in compose)
# The path /opt/django_app must be on PYTHONPATH so Django imports work in DAG tasks
ENV PYTHONPATH="/opt/django_app:${PYTHONPATH}"
