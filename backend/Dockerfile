FROM node:20-alpine

WORKDIR /app

# Copy package files first to reduce rebuild time
COPY package*.json ./

RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3000

# Start compiled JS
CMD ["npm", "start"]
