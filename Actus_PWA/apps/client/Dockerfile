# Build estático do client (Vite) servido por nginx. Mesmo padrão do projeto `web`.
FROM node:22-alpine AS build
WORKDIR /app

# Só o manifesto do client (monorepo: build isolado do workspace).
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

# Base da API embutida no bundle em tempo de build (ajuste no deploy).
ARG EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
