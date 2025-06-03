FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 10000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Start the application
CMD ["npm", "start"]