# Project Rules and Guidelines

## Project Overview
- Educational project demonstrating web application vulnerabilities
- Running on remote Linux Docker container (port 3001)
- Intentionally vulnerable for POC purposes

## Technology Stack
1. **Framework**
   - Fusion.js (not Express.js)
   - Koa (native to Fusion.js)
   - Built-in Fusion.js features preferred

2. **Dependencies**
   - Minimize new dependencies
   - Use yarn for Node.js packages
   - Use venv for Python dependencies

3. **Development Tools**
   - Docker for containerization
   - Python for testing and automation
   - Git for version control

## Development Guidelines

1. **Code Management**
   - Check for existing files before creating new ones
   - Don't modify core configuration files unless necessary:
     * Dockerfile
     * docker-compose.yml
     * package.json

2. **Docker Operations**
   - Use `docker-compose up -d` to maintain shell access
   - Use `docker build` instead of `docker compose build`
   - Always verify working directory with `pwd`

3. **Package Management**
   - Use yarn instead of npm
   - Use `yarn add --verbose` for better debugging
   - Activate venv before running Python scripts

## Docker Image Versioning

1. **Version Format**
   ```
   MAJOR.MINOR-GITSHA
   Example: 0.7-8287548
   ```
   - MAJOR: Breaking changes
   - MINOR: New features or non-breaking changes
   - GITSHA: First 7 characters of git commit hash

2. **Current Version: 0.7-8287548**
   Latest features: Integrated test suite and vulnerability verification

3. **Version History**
   - 0.7: Integrated test suite and vulnerability verification
   - 0.6: Added IDOR vulnerability
   - 0.5: Added path traversal
   - 0.4: Added command injection
   - 0.3: Added SSRF vulnerability
   - 0.2: Added authentication
   - 0.1: Initial release

4. **Registry Information**
   ```
   Registry: 339713064450.dkr.ecr.us-west-2.amazonaws.com/entropage/invoicer
   Format: REGISTRY:VERSION-GITSHA
   Example: 339713064450.dkr.ecr.us-west-2.amazonaws.com/entropage/invoicer:0.7-8287548
   ```

5. **Docker Commands**
   ```bash
   # Tag new version
   docker tag IMAGE_ID REGISTRY:VERSION-GITSHA
   
   # Also tag as latest (required for docker-compose.yml)
   docker tag IMAGE_ID REGISTRY:latest

   # Push both tags to registry
   docker push REGISTRY:VERSION-GITSHA
   docker push REGISTRY:latest

   # Pull specific version
   docker pull REGISTRY:VERSION-GITSHA
   ```

6. **Tagging Rules**
   - Always tag the latest version with both VERSION-GITSHA and :latest
   - Push both tags to ensure docker-compose.yml works with :latest
   - Keep version-specific tags for rollback capability
   - Update :latest tag with each new release

## Vulnerability Implementation
1. **SSRF (Server-Side Request Forgery)**
   - Implemented in invoice logo URL handling
   - Test with internal and external URLs

2. **Path Traversal**
   - Implemented in file reading functionality
   - Test with various path formats

3. **Command Injection**
   - Implemented in system command execution
   - Test with command chaining

4. **IDOR (Insecure Direct Object References)**
   - Implemented in invoice access
   - Test with user permission bypass

5. **JWT Vulnerabilities**
   - Implemented in authentication
   - Test with token manipulation 