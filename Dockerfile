# ───────────────────────────────────────
# Build stage (Vite / Node)
# ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time args (used by Vite)
ARG VITE_API_URL
ARG VITE_API_FILE_URL

# Expose them to the build process
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_FILE_URL=$VITE_API_FILE_URL

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build the app
RUN npm run build

# ───────────────────────────────────────
# Runtime stage (Nginx)
# ───────────────────────────────────────
FROM nginx:1.25-alpine

# Install envsubst for runtime config injection
RUN apk add --no-cache gettext

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx template (NOT final config)
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 80

# Start with env injection
ENTRYPOINT ["/entrypoint.sh"]