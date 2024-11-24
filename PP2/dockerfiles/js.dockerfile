# Use the official Node.js image
FROM node:latest

WORKDIR /app

CMD ["node", "/app/script.js"]
