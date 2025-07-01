# ---- Build frontend ----
FROM node:20 AS frontend-build

WORKDIR /app
COPY ../src/package*.json ./
RUN npm install
COPY ../src ./
RUN npm run build

# ---- Build backend ----
FROM python:3.11-slim AS backend-build

WORKDIR /app/backend
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ---- Final stage ----
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y ffmpeg nginx supervisor && rm -rf /var/lib/apt/lists/*

# Copy backend code and dependencies
COPY --from=backend-build /app /app

# Copy built frontend to Nginx html directory
COPY --from=frontend-build /app/dist /var/www/frontend

# Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create downloads directory
RUN mkdir -p /app/downloads

EXPOSE 3000

CMD ["/usr/bin/supervisord"]
