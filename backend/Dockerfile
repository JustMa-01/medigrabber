# ---- Build frontend ----
FROM node:20 AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# ---- Build backend ----
FROM python:3.11-slim AS backend-build

WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# ---- Final stage ----
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y ffmpeg nginx supervisor && rm -rf /var/lib/apt/lists/*

# Copy backend code and dependencies
COPY --from=backend-build /app/backend /app/backend

# Copy built frontend to Nginx html directory
COPY --from=frontend-build /app/dist /var/www/frontend

# Nginx config
COPY backend/nginx.conf /etc/nginx/nginx.conf

# Supervisor config
COPY backend/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create downloads directory
RUN mkdir -p /app/downloads

EXPOSE 3000

CMD ["/usr/bin/supervisord"]