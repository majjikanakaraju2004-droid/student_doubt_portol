# --- Build Stage ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency configs and perform clean install
COPY package.json package-lock.json ./
RUN npm ci

# Copy full frontend codebase
COPY . .

# Expose Vite Env base url parameter
ARG VITE_API_BASE_URL=/api/
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build production bundle
RUN npm run build

# --- Production Serve Stage ---
FROM nginx:1.27-alpine

# Copy custom Nginx configuration and optimized assets from build stage
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
