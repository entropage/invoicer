FROM invoicer:0.7-3f1a721
WORKDIR /app
COPY package.json yarn.lock ./
COPY src/ ./src/
RUN yarn install
ENV DEBUG=app:*
ENV PORT=3000
CMD ["yarn", "dev"]
