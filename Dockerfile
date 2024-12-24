FROM node:16

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN yarn build-production

# Expose the port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"] 