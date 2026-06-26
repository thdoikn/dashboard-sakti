# Security VA Remediation — Acunetix scan of `portal-dev.kotacerdas.id` (2026-06-25)

This document tracks remediation of the Acunetix Developer Report: **2 Medium, 1 Low, 7 Informational**.

## Root-cause summary

`portal-dev.kotacerdas.id` was pointing at the **Airflow webserver UI** (Flask-AppBuilder), which
was reachable from the public internet through Cloudflare. The React dashboard's nginx already sets
most security headers; the Airflow UI sets none. Per [README.md](README.md), the Airflow UI is meant
to be internal-only. Most findings are resolved by removing Airflow from public exposure; the two
Mediums sit at Cloudflare's TLS edge.

## Status by finding

| # | Finding | Sev | Fix | Where | Status |
|---|---------|-----|-----|-------|--------|
| 1 | TLS/SSL weak (CBC) cipher suites | Medium | Restrict edge ciphers to AEAD/GCM | **Cloudflare** | ⏳ hand-off (Part 2 below) |
| 2 | HSTS not enabled | Medium | HSTS at origin nginx + Cloudflare zone | nginx + Cloudflare | ✅ origin done / ⏳ Cloudflare |
| 3 | Cookies not marked Secure | Low | Cookie-Secure on Airflow + Django | repo | ✅ done |
| 4 | CSP not implemented | Info | Airflow lock-down (host removed) | infra | ✅ done (lock-down) |
| 5 | COEP not implemented | Info | Lock-down + COEP on dashboard nginx | infra + nginx | ✅ done |
| 6 | COOP not implemented | Info | Lock-down + COOP on dashboard nginx | infra + nginx | ✅ done |
| 7 | Permissions-Policy missing | Info | Lock-down (dashboard already sets it) | infra | ✅ done |
| 8 | Outdated bootstrap.js 3.4.1 | Info | Bundled with Airflow/FAB → lock-down | infra | ✅ done (not exposed) |
| 9 | Reverse Proxy detected | Info | Expected (Cloudflare) | — | accepted |
| 10 | WAF detected | Info | Expected (Cloudflare) | — | accepted |

## Part 1 — Changes applied in this repo

- **Airflow no longer public** — [docker-compose.prod.yml](docker-compose.prod.yml): `airflow-webserver`
  port bound to `127.0.0.1:8080:8080`. Reach the UI via SSH tunnel:
  `ssh -L 8080:localhost:8080 devapp@10.20.103.57` → http://localhost:8080
- **Airflow cookie hardening** — `AIRFLOW__WEBSERVER__COOKIE_SECURE/COOKIE_SAMESITE/ENABLE_PROXY_FIX`.
- **Django cookie Secure** — [backend/config/settings/production.py](backend/config/settings/production.py):
  `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` → `True`.
- **nginx** — [frontend/nginx.conf](frontend/nginx.conf): forward `X-Forwarded-Proto` to backend;
  add `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`.

### Manual steps still required on the VM

1. **Pull rebuilt images & restart** (nginx/Django changes are baked into the GHCR images):
   ```
   cd ~/sakti
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```
   Update the VM's `~/sakti/docker-compose.prod.yml` to match this repo (port + Airflow env vars).
2. **Remove the public route to Airflow** — confirm how `portal-dev.kotacerdas.id` reaches the VM:
   - `systemctl status cloudflared` / `docker ps | grep cloudflared` / `ls /etc/cloudflared/`
   - If a **cloudflared tunnel** maps `portal-dev → localhost:8080`: remove that ingress rule and
     `systemctl restart cloudflared`.
   - If a **proxied DNS record** points to the VM: ask the Cloudflare admin to delete/repoint it
     (or front it with Cloudflare Access for authenticated remote use).

> ⚠️ COEP caution: `Cross-Origin-Embedder-Policy: require-corp` can block cross-origin sub-resources
> (e.g. Google Fonts loaded via CSS). After deploy, load the dashboard and check the browser console
> for COEP-blocked resources. If anything breaks, change COEP to `credentialless` or remove it
> (it's an Informational finding only). HSTS and COOP are safe.

## Part 2 — Request for the Cloudflare zone admin (`kotacerdas.id`)

These two **Medium** findings are at Cloudflare's TLS edge and cannot be fixed from the origin:

1. **Weak TLS cipher suites (Medium).** Restrict edge cipher suites to AEAD/GCM only and remove the
   four flagged CBC suites:
   - `TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA`
   - `TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA`
   - `TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256`
   - `TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384`

   Keep TLS 1.2 + 1.3, **Minimum TLS Version 1.2**.
   Dashboard: *SSL/TLS → Edge Certificates → cipher suites*, or API
   `PATCH /zones/{zone_id}/settings/ciphers` with a GCM/CHACHA20 list.
2. **HSTS (Medium).** Enable zone HSTS: *SSL/TLS → Edge Certificates → HTTP Strict Transport Security*
   → `max-age=31536000; includeSubDomains` (add `preload` only after all subdomains are HTTPS).
3. **Always Use HTTPS** — enable the redirect rule.

## Verification (after deploy + Cloudflare changes)

1. Airflow not public: `curl -I https://portal-dev.kotacerdas.id/login/` → fails/times out/404.
   Internal SSH-tunnel access still works.
2. Cookie Secure: log into the dashboard over HTTPS; confirm `Set-Cookie: ...; Secure; HttpOnly`.
3. HSTS: `curl -I https://<dashboard-host>/` shows `Strict-Transport-Security`.
4. TLS ciphers: re-run SSL Labs (ssllabs.com/ssltest) → no CBC suites; A/A+ grade.
5. Re-scan with Acunetix → 2 Mediums + Low cleared.
