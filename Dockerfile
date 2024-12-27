FROM 339713064450.dkr.ecr.us-west-2.amazonaws.com/entropage/invoicer:latest
WORKDIR /app
COPY package.json ./
COPY src/ ./src/
RUN yarn install --production
ENV NODE_ENV=production
ENV DEBUG=app:*
CMD ["yarn", "run", "dev"]
