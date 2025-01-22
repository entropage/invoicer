FROM node:18.20.5
WORKDIR /app

# Copy all project files
COPY . .

# Install dependencies
RUN yarn install

ENV DEBUG=app:*
ENV PORT=3000
CMD ["yarn", "dev"]
