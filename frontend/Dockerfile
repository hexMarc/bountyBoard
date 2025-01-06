FROM node:20.13-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc

# Copy package files
COPY package*.json ./

# Configure npm for better reliability
RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retry-mintimeout 100000 \
    && npm config set fetch-timeout 300000

# Install dependencies
RUN npm install --fetch-timeout 300000 --fetch-retry-maxtimeout 600000

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
