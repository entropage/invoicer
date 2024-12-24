# build and run this project in docker with docker compose

## Context
- Windows host environment
- Docker engine running on remote Linux server
- Using "remote-linux" as docker context
- the app is running on port 3000, use port 3002 for the app in docker compose file
- the entire project is in the current directory, it's a fusion.js project
- build it with the fusion.js build command inside the docker container
- don't introduce any new dependencies, only use the ones already in the project if possible at all

## Goals
1. Containerize the application using Docker
2. Set up Docker Compose configuration
3. find all endpoints, and web pages
4. Create tests to verify endpoints and web pages

## Required Information
- [ ] Application type and framework
- [ ] Existing application code location
- [ ] List of endpoints to test
- [ ] Required dependencies and versions

## Action Plan
1. Review application code and requirements
2. Create Dockerfile
3. Create docker-compose.yml
4. Set up testing script in Python
5. Verify remote Docker context setup
6. Build and test

## Discovered Endpoints
- POST /api/invoice - Create invoice
- GET /api/invoice/all - List all invoices
- POST /api/invoice/download - Download invoice
- GET /api/invoice/:id - Get specific invoice

## Progress
- Initial plan created
- Context and requirements clarified
- Created Dockerfile with Node.js 16 base image and build configuration
- Created docker-compose.yml with:
  - Port 3002:3000 mapping
  - MongoDB service
  - Volume for MongoDB persistence
- Successfully tested Docker setup:
  - Application builds correctly
  - MongoDB connects successfully
  - All endpoints are registered
- Next steps:
  1. Create test script for endpoints
  2. Document any additional findings
