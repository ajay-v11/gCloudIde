# Use the official Node.js 20 as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /code

# Create the /workspace directory
RUN mkdir -p /workspace

# Install system-level dependencies, including PHP CLI
RUN apk add --no-cache \
    bash \
    python3 \
    py3-pip \
    make \
    g++ \
    openjdk11 \
    maven \
    php-cli \
    php-phar \
    php-mbstring \
    php-xml \
    php-openssl

# Create a virtual environment for Python
RUN python3 -m venv /venv

# Activate the virtual environment and install Python packages
RUN . /venv/bin/activate && \
    pip install --upgrade pip && \
    pip install numpy pandas

# Set the virtual environment as the default Python environment
ENV PATH="/venv/bin:$PATH"

# Copy only package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install && \
    npm install -g typescript

# Copy the rest of your application's code to the working directory
COPY . .

# Build your app
RUN npm rebuild node-pty --update-binary && \
    npm run build

# Expose port 3001 for your Node.js app
EXPOSE 3001

# Set the default command
CMD ["npm", "start"]
