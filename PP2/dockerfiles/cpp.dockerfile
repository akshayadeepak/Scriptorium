# Use a base image with g++ pre-installed
FROM gcc:latest

# Set the working directory inside the container
WORKDIR /app

# Install build-essential (g++, make, etc.)
RUN apt-get update && apt-get install -y build-essential

# Set the default command to run the C++ program
CMD ["sh", "-c", "g++ /app/main.cpp -o /app/main && /app/main"]
