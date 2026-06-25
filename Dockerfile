FROM node:18-alpine

WORKDIR /app

# Copy package info and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port and start
EXPOSE 5000
CMD ["npm", "start"]
