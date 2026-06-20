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

# Mount point for the Django backend code (shared via volume in compose at /opt/django_app)
# PYTHONPATH makes Django ORM and sakti_client importable inside DAG tasks (Option A per CLAUDE.md)
ENV PYTHONPATH="/opt/django_app:/opt/airflow/backend:${PYTHONPATH}"
