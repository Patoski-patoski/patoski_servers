# Use Nodde.js image
FROM node:18-alpine

# Create app directory
WORKDIR /server

# Install dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Run app
CMD [ "npm", "run", "dev" ]
