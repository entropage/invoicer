FROM node:18.20.5-slim AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY package.json yarn.lock ./

# Install all dependencies including devDependencies for build
RUN yarn install --frozen-lockfile

# Copy source files and build configs
COPY webpack.config.js .fusionrc.js ./
COPY src/ ./src/

# Build the application
RUN yarn build

############################
# Production stage
############################
FROM node:18.20.5-slim
WORKDIR /app

# Copy package.json for Fusion.js runtime
COPY package.json ./

# Copy only the bundled application
COPY --from=builder /app/.fusion ./.fusion

# Install only fusion-cli for runtime
RUN yarn add fusion-cli --production && \
    yarn cache clean && \
    mkdir -p logs

ENV DEBUG=app:*
ENV PORT=3000

CMD ["yarn", "start"]
