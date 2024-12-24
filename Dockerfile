FROM node:18

WORKDIR /app

# Install system tools
RUN apt-get update && apt-get install -y \
    iputils-ping \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install
RUN yarn add @koa/router@12.0.1

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3001
ENV DEBUG=*

# Start the application
CMD ["node", "--inspect=0.0.0.0:9229", "node_modules/.bin/fusion", "dev", "--port=3001", "--dir=."]

EXPOSE 3001 9229 