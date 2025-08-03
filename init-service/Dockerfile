FROM node:18-alpine

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy rest of the code
COPY . .

# Build application
RUN npm run build

# Keep Prisma CLI for runtime operations
# Install only production dependencies but keep @prisma/client
RUN npm ci --only=production

# Ensure Prisma client is available
RUN npx prisma generate

EXPOSE 8080

CMD ["npm", "start"]