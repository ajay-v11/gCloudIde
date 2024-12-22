# Use the official Node.js 14 as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /code

# Create the /user directory
RUN mkdir -p /user

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install any dependencies
RUN npm install && \
npm install -g typescript

# Copy the rest of your application's code to the working directory
COPY . .

# Build your app
# Rebuild node-pty and build the application
RUN npm rebuild node-pty --update-binary && \
npm run build

# Your app binds to port 3001 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3001

# Define the command to run your app using CMD which defines your runtime
CMD [ "npm", "start" ]