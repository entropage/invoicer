# Project Rules and Guidelines

## Development Rules

1. **Project Purpose**
   - This is an educational project
   - Security vulnerabilities are intentional for POC purposes
   - Do not attempt to fix security issues unless specifically requested

2. **Technology Stack**
   - Use Fusion.js instead of Express.js
   - Use Koa (native to Fusion.js)
   - Minimize new dependencies
   - Use built-in Fusion.js features when possible

3. **Development Practices**
   - Check for existing files before creating new ones
   - Always use `docker-compose up -d` to keep shell access
   - Run `pwd` before commands with directory dependencies
   - Use `docker build` instead of `docker compose build`
   - Activate virtual environment (`source venv/bin/activate`) before running Python scripts

## Docker Image Versioning Rules

1. **Version Format: MAJOR.MINOR**
   - MAJOR: Breaking changes
   - MINOR: New features or non-breaking changes

2. **Image Tags**
   - Format: VERSION-GITSHA
   - Example: 0.7-3f1a721

3. **Tag Management**
   - Never reuse version tags
   - Each build gets a new version number
   - Keep old versions available in registries

4. **Registry Rules**
   - Development: Local registry (invoicer:VERSION-GITSHA)
   - Staging: AWS ECR (339713064450.dkr.ecr.us-west-2.amazonaws.com/entropage/invoicer:VERSION-GITSHA)
   - Production: Same as staging but with additional testing

5. **Version History**
   - 0.1: Initial release
   - 0.2: Added authentication
   - 0.3: Added SSRF vulnerability
   - 0.4: Added command injection
   - 0.5: Added path traversal
   - 0.6: Added IDOR vulnerability
   - 0.7: Integrated test suite and vulnerability verification

6. **Build Process**
   - Always build from a clean workspace
   - Tag with both version and git SHA
   - Push to all required registries
   - Document changes in version history 