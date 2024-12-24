FROM node:18

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install
RUN yarn add @koa/router@12.0.1

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3001

# Start the application
CMD ["npx", "fusion", "dev", "--port=3001", "--dir=.", "--no-autoReload", "--no-hmr"]

EXPOSE 3001 