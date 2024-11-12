# Use an official Node.js runtime as the base image
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

# Copy the rest of the application code
COPY . .

# Expose port 3000 (or the port your app is using)
EXPOSE 3000

# Start the application using nodemon for automatic restarts
CMD ["nodemon", "src/app.js"]
