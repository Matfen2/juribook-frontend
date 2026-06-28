# ═══════════════════════════════════════════════════════════
#  juribook-frontend - Dockerfile multi-stage
#  Étape 1 : build Vite
#  Étape 2 : serve via Nginx
# ═══════════════════════════════════════════════════════════

# Étape 1 : Build
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Étape 2 : Serve via Nginx
FROM nginx:alpine AS runtime

# Copier le build Vite dans le dossier servi par Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Config Nginx pour React Router (toutes les routes → index.html)
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]