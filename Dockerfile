# Stage 1 — build the Vite SPA
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2 — serve with nginx (SPA history fallback)
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# SPA fallback: any path that doesn't match a file serves index.html
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1
