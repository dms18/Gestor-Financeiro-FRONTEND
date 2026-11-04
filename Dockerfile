# Build Angular 12 / Ionic 5 + nginx. Contexto: Gestor-Financeiro-FRONTEND
# O bundle e portavel: o estagio de build roda na arquitetura do host (sem emulacao arm64)
FROM --platform=$BUILDPLATFORM node:16-alpine AS build
ARG CONFIGURATION=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Identificação do build exibida no badge de versão (preenchida pela pipeline)
ARG GIT_SHA=dev
ARG BUILD_DATE=
RUN printf "export const buildInfo = { sha: '%s', date: '%s' };\n" "$GIT_SHA" "$BUILD_DATE" > src/environments/build-info.ts
RUN npx ng build --configuration ${CONFIGURATION}

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/www /usr/share/nginx/html
EXPOSE 80
