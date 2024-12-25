# Use the working image as base
FROM 339713064450.dkr.ecr.us-west-2.amazonaws.com/entropage/invoicer:latest
WORKDIR /app

# Copy patch files
COPY package.json /app/

# Install dependencies and apply patches
RUN yarn install

# Copy the rest of the application
COPY . /app/

# Start the application
CMD ["yarn", "run", "dev"] 