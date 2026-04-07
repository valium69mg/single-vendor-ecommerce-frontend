FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_API_FILE_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_FILE_URL=$VITE_API_FILE_URL

COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run build

# ─────────────────────────────────────────

FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]