# Use the official Node.js 20 as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /code

# Create the /workspace directory
RUN mkdir -p /workspace

# Install system-level dependencies
RUN apk add --no-cache bash python3 py3-pip make g++ openjdk11 maven

# Create a virtual environment
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
# Rebuild node-pty and build the application
RUN npm rebuild node-pty --update-binary && \
    npm run build

# Expose port 3001
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
