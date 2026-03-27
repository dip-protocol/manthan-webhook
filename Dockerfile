# Use lightweight Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

# Copy rest of app
COPY . .

# Expose port (Fly uses 8080 internally)
EXPOSE 8080

# Start app
CMD ["npm", "start"]