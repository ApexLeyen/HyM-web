# Use lightweight Node.js 20 LTS Alpine image
FROM node:20-alpine

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port (default 3000)
ENV PORT=3000
EXPOSE 3000

# Start application
CMD ["npm", "start"]
