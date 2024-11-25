# Use the official Go image
FROM golang:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the Go source code into the container
COPY . .

# Command to run the Go application
CMD ["go", "run", "main.go"]