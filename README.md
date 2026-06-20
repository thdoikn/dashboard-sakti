# SAKTI-OIKN Integration Platform

An integration platform that automates pulling budget and disbursement data from the SAKTI application (Indonesia's Ministry of Finance / Kemenkeu) into OIKN's internal systems, for budget monitoring by Biro POKS.

See [`PRD.md`](./PRD.md) for full product requirements and [`CLAUDE.md`](./CLAUDE.md) for the build guide used by Claude Code.

## Stack

- **Orchestration**: Apache Airflow (LocalExecutor)
- **Backend / API**: Django + Django REST Framework
- **Database**: MySQL 8 (shared instance — separate databases/users for app data and Airflow metadata)
- **Frontend**: React (Vite) + TailwindCSS + Recharts
- **Containerization**: Docker + Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Ports `3000`, `8000`, `8080`, and `3306` free on your machine (see [Service URLs](#service-urls) below)

## Getting Started (Development)

1. Clone the repository and move into it:
   ```bash
   cd sakti-oikn
   ```

2. Copy the environment template and fill in local values:
   ```bash
   cp .env.example .env
   ```
   At minimum, set `DJANGO_SECRET_KEY`, `MYSQL_ROOT_PASSWORD`, `MYSQL_DATA_PASSWORD`, `MYSQL_AIRFLOW_PASSWORD`, `AIRFLOW__WEBSERVER__SECRET_KEY`, and `AIRFLOW_ADMIN_PASSWORD`. Development defaults for `SAKTI_API_BASE_URL` and `SAKTI_GATEWAY_API_KEY` already point at the mock server, so they don't need real Kemenkeu credentials yet.

3. Start the stack:
   ```bash
   docker-compose up --build
   ```

4. In a separate terminal, run initial database migrations and seed dummy data:
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py seed_dummy_data
   ```

5. Create a Django superuser (for Django Admin access):
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

6. Open the dashboard at `http://localhost:3000` — it should already show data from the seed step.

## Running the Pipeline Manually

Until the daily 02:00 WIB schedule kicks in naturally, you can trigger a sync manually from the Airflow UI (`http://localhost:8080`) or via CLI:

```bash
docker-compose exec airflow-webserver airflow dags trigger sakti_daily_sync
```

Check progress and logs in the Airflow UI's Graph or Grid view for the `sakti_daily_sync` DAG.

## Service URLs (Development)

| Service | URL | Notes |
|---|---|---|
| Frontend dashboard | http://localhost:3000 | React (Vite) dev server |
| Backend API | http://localhost:8000/api/ | Django REST Framework |
| Django Admin | http://localhost:8000/admin/ | Requires superuser created above |
| Mock SAKTI API | http://localhost:8000/sitp-monsakti-omspan/webservice/ | Simulated SAKTI responses |
| Airflow UI | http://localhost:8080 | Login with `AIRFLOW_ADMIN_USER` / `AIRFLOW_ADMIN_PASSWORD` |
| MySQL | localhost:3306 | Two logical databases: `sakti_data`, `airflow_metadata` |

## Switching from Mock to Real SAKTI API

When real Kemenkeu credentials (API key + whitelisted IP) become available, update only these `.env` values — no code changes should be required:

```bash
SAKTI_API_BASE_URL=https://apigateway.kemenkeu.go.id/sitp-monsakti-omspan/webservice
SAKTI_GATEWAY_API_KEY=<real-api-key-from-kemenkeu>
```

Restart the backend and Airflow services after updating:

```bash
docker-compose restart backend airflow-webserver airflow-scheduler
```

## Production Deployment

A separate `docker-compose.prod.yml` is provided for production-style deployment. Key differences from dev:

- Pre-built images — no source volume mounts (code baked into images)
- All services use `restart: unless-stopped`
- Healthchecks on every service; `depends_on` uses `condition: service_healthy`
- Backend runs under `gunicorn` (4 workers), frontend served by `nginx:alpine`
- Airflow backend volume is mounted read-only

```bash
# Make sure .env has production values:
#   DJANGO_DEBUG=False
#   DJANGO_SECRET_KEY=<strong-random-key>
#   DJANGO_ALLOWED_HOSTS=<your-server-hostname>
#   MYSQL_ROOT_PASSWORD, MYSQL_DATA_PASSWORD, MYSQL_AIRFLOW_PASSWORD — all strong passwords
#   AIRFLOW__WEBSERVER__SECRET_KEY=<strong-random-key>

docker-compose -f docker-compose.prod.yml up --build -d
```

Dashboard is available on port 80; Airflow UI on port 8080. Both ports should be firewalled from the public internet and accessible only via the internal OIKN network.

### Healthchecks

| Service | Endpoint | Interval |
|---|---|---|
| MySQL | `mysqladmin ping` | 10s |
| Backend | `GET /health/` | 30s |
| Frontend | `GET /` (nginx) | 30s |
| Airflow webserver | `GET /health` | 30s |

## Common Commands

```bash
# Tail logs for a specific service
docker-compose logs -f backend
docker-compose logs -f airflow-scheduler

# Run Django management commands
docker-compose exec backend python manage.py <command>

# Open a MySQL shell
docker-compose exec mysql mysql -u root -p

# Stop the stack
docker-compose down

# Stop the stack and remove volumes (full reset, including database data)
docker-compose down -v
```

## Project Structure

```
sakti-oikn/
├── backend/        # Django app: models, REST API, mock SAKTI server, SAKTI client
├── airflow/         # Airflow DAGs and plugins
├── frontend/         # React (Vite) dashboard
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── PRD.md            # Full product requirements
├── CLAUDE.md          # Build guide for Claude Code
└── README.md          # This file
```

## Known Limitations (v1)

- No dashboard authentication — access should be restricted at the network level (internal OIKN network only).
- Only 6 SAKTI endpoints are integrated (`refSts`, `dataAng`, `sppHeader`, `refAdmin`, `refUraian`, `capaianRO`); see `PRD.md` section 4.1 for the full list and section 5 for what's explicitly out of scope.
- Data is currently pulled per satker, not per K/L, following the access mechanism Kemenkeu provides today.
