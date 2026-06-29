# Multi-stage Dockerfile for React Frontend
# --- Stage 1: Build static assets ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (to leverage docker cache layer)
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy configuration and source files
COPY frontend/tsconfig.json frontend/tsconfig.node.json ./
COPY frontend/vite.config.ts frontend/tailwind.config.js frontend/postcss.config.js ./
COPY frontend/index.html ./
COPY frontend/src/ ./src/

# Compile React SPA
RUN npm run build

# --- Stage 2: Serve using Nginx reverse proxy ---
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy proxy server config
COPY deployment/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
