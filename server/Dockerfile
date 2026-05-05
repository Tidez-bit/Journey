FROM node:20-slim

WORKDIR /app

# Install OpenSSL untuk Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push --force-reset && node server.js"]