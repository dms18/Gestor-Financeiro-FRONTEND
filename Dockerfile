# Build Angular 12 / Ionic 5 + nginx. Contexto: Gestor-Financeiro-FRONTEND
FROM node:16-alpine AS build
ARG CONFIGURATION=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx ng build --configuration ${CONFIGURATION}

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/www /usr/share/nginx/html
EXPOSE 80
