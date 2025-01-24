# Build and Run Task

## Current Goal
Build and run the invoicer application using Docker in an environment with restricted internet access.

## Environment Setup
- OS: Windows 10 (win32 10.0.26100)
- Docker with proxy requirements
- HTTP/HTTPS Proxy: http://192.168.1.100:7890

## Challenges Encountered
1. Network Connectivity
   - Docker build having issues accessing npm registry
   - Need to configure proxy settings at multiple levels

2. Webpack Build Issues
   - Problems with node: protocol URLs
   - async_hooks module not found
   - Conflicts between development and production environments

## Successful Solutions
1. Proxy Configuration in Dockerfile
   ```dockerfile
   ENV HTTP_PROXY=http://192.168.1.100:7890 \
       HTTPS_PROXY=http://192.168.1.100:7890 \
       NODE_ENV=development \
       DEBUG=app:* \
       PORT=3000

   # Configure yarn to use proxy
   RUN yarn config set httpProxy http://192.168.1.100:7890 && \
       yarn config set httpsProxy http://192.168.1.100:7890
   ```

2. Webpack Configuration
   - Added node-polyfill-webpack-plugin
   - Configured fallbacks for node built-in modules
   - Set target to 'node'
   - Running in development mode

3. Dependencies Management
   - Removed non-essential dependencies (puppeteer)
   - Added browser-compatible polyfills
   - Added node-polyfill-webpack-plugin to devDependencies

## Current Status
- ✅ Successfully built Docker image
- ✅ Application running on port 3000
- ✅ MongoDB connected successfully
- ✅ Default user created

## Docker Commands
```bash
# Build the image
docker build -t invoicer .

# Run the application
docker-compose up -d

# Check logs
docker-compose logs invoicer
docker logs invoicer-invoicer-1
```

## Services
- Invoicer application: http://localhost:3000
- MongoDB: localhost:27017

## Next Steps
1. Add node-polyfill-webpack-plugin to package.json
2. Test build in development mode
3. Verify proxy settings are properly propagated
4. Test application accessibility on port 3000

## Docker Commands
```bash
# Build the image
docker build -t invoicer .

# Run the application
docker-compose up -d

# Check logs
docker-compose logs invoicer
``` 