# Use a base image with gcc pre-installed
FROM gcc:latest

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential

CMD ["sh", "-c", "gcc /app/main.c -o /app/main && /app/main"]
