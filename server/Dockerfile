FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --silent
COPY server .
EXPOSE 3000