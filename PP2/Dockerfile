# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your application's source code to the container
COPY . .

# Ensure startup.sh is executable
RUN chmod +x ./startup.sh

# Expose the port your app runs on (if applicable)
EXPOSE 3000

# Run startup.sh when the container launches
CMD ["./startup.sh"]

