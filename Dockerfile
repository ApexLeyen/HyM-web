# Use Debian-based Node.js 20 LTS image (glibc compatible)
FROM node:20-slim

# Install compilation tools needed by node-gyp for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Expose port (Render sets $PORT dynamically)
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
