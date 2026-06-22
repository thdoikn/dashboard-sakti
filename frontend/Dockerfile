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
# Override with --build-arg VITE_API_BASE_URL=... only when not using nginx proxy.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ── runtime (production) ──────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing (React Router fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ── development ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
