FROM 339713064450.dkr.ecr.us-west-2.amazonaws.com/entropage/invoicer:0.7-e20ab83
WORKDIR /app
COPY package.json yarn.lock ./
COPY src/ ./src/
RUN yarn install
ENV DEBUG=app:*
CMD ["yarn", "dev"]
