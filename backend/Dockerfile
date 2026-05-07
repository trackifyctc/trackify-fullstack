FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build the application first
RUN npm run build

# Expose port
EXPOSE 3001

# Run development server with watch mode
CMD ["npm", "run", "start:dev"]

