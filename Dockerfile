# Use the working image as base
FROM 339713064450.dkr.ecr.us-west-2.amazonaws.com/entropage/invoicer:0.3
WORKDIR /app

# Copy patch files
COPY patches /app/patches/
COPY package.json /app/

# Install dependencies and apply patches
RUN npm install && \
    npm run postinstall

# Copy the rest of the application
COPY . /app/

# Start the application
CMD ["npm", "run", "dev"] 