#!/bin/bash

# Ensure the script exits if any command fails
set -e

echo "Installing npm packages..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Applying Prisma migrations..."
npx prisma migrate deploy

# Function to check and install a package if not present
install_if_missing() {
    if ! command -v "$1" &> /dev/null; then
        echo "$2 is not installed. Installing $2..."
        sudo apt-get update
        sudo apt-get install -y "$3"
    else
        echo "$2 is already installed."
    fi
}

# Check and install GCC if not installed
install_if_missing gcc "GCC" gcc

# Check and install G++ if not installed
install_if_missing g++ "G++" g++

# Check and install Java if not installed
install_if_missing javac "Java" default-jdk

# Check and install Python3 if not installed
install_if_missing python3 "Python3" python3

# Check and install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    # Add current user to docker group
    sudo usermod -aG docker $USER
    # Apply new group membership immediately
    newgrp docker
else
    echo "Docker is already installed."
fi

# Check and install Docker Buildx if not installed
if ! docker buildx version &> /dev/null; then
    echo "Docker Buildx is not installed. Installing Buildx..."
    mkdir -p ~/.docker/cli-plugins/
    BUILDX_ARCH=$(uname -m)
    if [ "$BUILDX_ARCH" = "x86_64" ]; then
        BUILDX_ARCH="amd64"
    elif [ "$BUILDX_ARCH" = "aarch64" ]; then
        BUILDX_ARCH="arm64"
    elif [ "$BUILDX_ARCH" = "armv7l" ]; then
        BUILDX_ARCH="arm-v7"
    elif [ "$BUILDX_ARCH" = "ppc64le" ]; then
        BUILDX_ARCH="ppc64le"
    elif [ "$BUILDX_ARCH" = "s390x" ]; then
        BUILDX_ARCH="s390x"
    else
        echo "Unsupported architecture: $BUILDX_ARCH"
        exit 1
    fi

    # Fetch the latest version tag from GitHub API
    BUILDX_LATEST=$(curl -sL https://api.github.com/repos/docker/buildx/releases/latest | grep '"tag_name"' | cut -d '"' -f 4)

    # Correct the download URL and filename
    BUILDX_BINARY="buildx-${BUILDX_LATEST}.linux-${BUILDX_ARCH}"
    DOWNLOAD_URL="https://github.com/docker/buildx/releases/download/${BUILDX_LATEST}/${BUILDX_BINARY}"

    echo "Downloading Buildx from $DOWNLOAD_URL..."

    # Download the Buildx binary for the appropriate architecture
    curl -SL "$DOWNLOAD_URL" -o ~/.docker/cli-plugins/docker-buildx

    # Verify the download
    if [ ! -s ~/.docker/cli-plugins/docker-buildx ]; then
        echo "Failed to download Docker Buildx binary."
        exit 1
    fi

    chmod +x ~/.docker/cli-plugins/docker-buildx

    # Verify Buildx installation
    if ! docker buildx version &> /dev/null; then
        echo "Failed to install Docker Buildx."
        exit 1
    fi
else
    echo "Docker Buildx is already installed."
fi

# Start Docker service if not running
if ! pgrep dockerd &> /dev/null; then
    echo "Starting Docker service..."
    sudo service docker start
fi

echo "Building Docker images for supported languages..."

# Enable BuildKit
export DOCKER_BUILDKIT=1

# List of Dockerfiles and their corresponding image names
declare -A dockerfiles=(
  ["c"]="c.dockerfile"
  ["cpp"]="cpp.dockerfile"
  ["go"]="go.dockerfile"
  ["java"]="java.dockerfile"
  ["js"]="js.dockerfile"
  ["python"]="python.dockerfile"
  ["ruby"]="ruby.dockerfile"
  ["rust"]="rust.dockerfile"
  ["swift"]="swift.dockerfile"
  ["r"]="r.dockerfile"
)

# Build images using Buildx
for lang in "${!dockerfiles[@]}"; do
  dockerfile="${dockerfiles[$lang]}"
  image_name="pp2_${lang}"
  dockerfile_path="dockerfiles/${dockerfile}"
  if [ -f "$dockerfile_path" ]; then
    echo "Building image for $lang from $dockerfile using Buildx..."
    docker buildx build --output type=docker -f "$dockerfile_path" -t "$image_name" .
  else
    echo "Dockerfile for $lang not found at $dockerfile_path."
  fi
done

echo "All Docker images built successfully."

echo "Starting the application..."
npm run dev &

# Get the PID of the npm process
NPM_PID=$!

# Wait for server to start before creating the user
echo "Waiting for the server to start..."
sleep 10

echo "Creating admin user..."
curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
        "username": "adminUser",
        "email": "admin@example.com",
        "password": "password123",
        "phoneNumber": "1234567890"
    }'

# Stop the npm dev server
kill $NPM_PID

echo "Environment setup is complete."

