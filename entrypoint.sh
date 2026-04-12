#!/bin/sh
set -e

# Default fallback (optional)
: "${BACKEND_ADDRESS:=http://backend:8080}"

echo "Using BACKEND_ADDRESS=$BACKEND_ADDRESS"

# Substitute env vars into nginx config
envsubst '${BACKEND_ADDRESS}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

# Start nginx
exec nginx -g 'daemon off;'