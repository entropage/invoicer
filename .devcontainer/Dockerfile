FROM node:18.20.5-slim

# Install git and other development tools
RUN apt-get update && \
    apt-get install -y git python3 python3-pip python3-venv procps && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Install global development tools
RUN yarn global add nodemon

# Create and activate Python virtual environment
ENV VIRTUAL_ENV=/workspace/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python testing tools in virtual environment
RUN pip3 install --no-cache-dir pytest pytest-cov pytest-html

# Create non-root user for better security
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Ensure user has access to workspace and venv
RUN mkdir -p /workspace/node_modules && \
    chown -R $USERNAME:$USERNAME /workspace

USER $USERNAME

# Set development environment variables
ENV NODE_ENV=development
ENV DEBUG=app:*
ENV PORT=3000

CMD ["sleep", "infinity"]
