FROM node:18

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
ENV NODE_ENV=development
ENV PORT=3001

CMD ["yarn", "dev", "--port=3001", "--dir=.", "--no-autoReload", "--no-hmr"]

EXPOSE 3001 