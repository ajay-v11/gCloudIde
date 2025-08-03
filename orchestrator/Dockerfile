FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Remove dev dependencies after build
RUN npm ci --only=production && npm cache clean --force

EXPOSE 8080
CMD ["npm", "start"]