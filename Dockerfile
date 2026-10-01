# Use lightweight Debian-based Node.js 20 LTS image (glibc for better-sqlite3 compatibility)
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (uses precompiled glibc binaries, avoiding Alpine musl SIGSEGV)
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Expose port (Render sets $PORT dynamically, default 3000)
ENV PORT=3000
EXPOSE 3000

# Start application directly
CMD ["node", "server.js"]
