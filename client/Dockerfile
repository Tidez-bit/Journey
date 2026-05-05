FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

# Dev mode dengan host 0.0.0.0 agar bisa diakses dari luar container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]