# Multi-stage Dockerfile for React frontend (Vite)
# Stage 1: builder — runs npm build
# Stage 2: runtime — nginx:alpine serves the static build output
# Stage: development — for Vite dev server with hot reload

# ── builder ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Default to /api so nginx proxies requests to the backend container.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Keycloak SSO — set via GitHub repo variables (Settings → Variables → Actions).
# VITE_OIDC_AUTHORITY  = Keycloak authorization endpoint URL
# VITE_OIDC_CLIENT_ID  = Keycloak client ID for this app
ARG VITE_OIDC_AUTHORITY=""
ARG VITE_OIDC_CLIENT_ID=""
ENV VITE_OIDC_AUTHORITY=${VITE_OIDC_AUTHORITY}
ENV VITE_OIDC_CLIENT_ID=${VITE_OIDC_CLIENT_ID}

RUN npm run build

# ── runtime (production) ──────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing (React Router fallback).
# security-headers.conf is included by nginx.conf at the server level AND inside
# the static-asset block, so headers are applied to every response (incl. *.js/*.css).
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ── development ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
