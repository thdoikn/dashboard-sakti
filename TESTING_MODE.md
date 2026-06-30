# No-Auth Testing Mode (SSO bypass)

For QA/testing you can run the dashboard **without SSO** — it auto-lands on the
overview page with a mock superadmin user. This is controlled entirely from the
**backend**; no frontend rebuild is needed.

## How it works

- The frontend asks the backend `GET /api/auth/config/` on startup.
  - `{"auth_enabled": true}`  → normal SSO login (default).
  - `{"auth_enabled": false}` → bypass login, seed a mock user, open dashboard.
- The backend opens auth only when **both** are true:
  1. `DJANGO_SETTINGS_MODULE=config.settings.testing`, and
  2. `AUTH_DISABLED=true`.

## Safety

`config.settings.production` **force-enables** authentication and ignores
`AUTH_DISABLED` — so the real production deployment can never be opened, even if
the env var leaks. No-auth mode requires the dedicated `config.settings.testing`
module (which still keeps all production hardening: security headers, secure
cookies, restricted CORS).

## Turn it ON (e.g. on the VM)

In `docker-compose.prod.yml`, set the **backend** service:
```yaml
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.testing   # was config.settings.production
      AUTH_DISABLED:          "true"
```
Also update the `command:` migrate line to match:
`python manage.py migrate --settings=config.settings.testing`. Then:
```bash
docker compose -f docker-compose.prod.yml up -d backend
```

## Turn it OFF (restore SSO)

Revert both back to `config.settings.production` (and drop `AUTH_DISABLED`), then
`docker compose -f docker-compose.prod.yml up -d backend`.

## Local dev

Run the backend with `AUTH_DISABLED=true` under development/testing settings; the
Vite dev server needs no special flag — it reads the mode from the backend.
