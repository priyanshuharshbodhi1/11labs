# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/build ./build

# Cloud Run provides the PORT environment variable
ENV PORT=8080

CMD ["sh", "-c", "serve -s build -l $PORT"]
