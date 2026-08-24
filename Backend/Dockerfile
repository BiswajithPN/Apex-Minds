# Use official Node.js LTS image
FROM node:20-slim

# Install dependencies for sharp and tesseract
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Expose port
EXPOSE 8000

# Start the server
CMD ["node", "server.js"]
