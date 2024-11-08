#!/bin/bash

npm install
npx prisma generate
npx prisma migrate deploy

if ! command -v gcc &> /dev/null; then
    echo "GCC is not installed. Please install it."
    exit 1
fi

if ! command -v g++ &> /dev/null; then
    echo "G++ is not installed. Please install it."
    exit 1
fi

if ! command -v javac &> /dev/null; then
    echo "Java is not installed. Please install it."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Please install it."
    exit 1
fi

npm run dev &

# wait for server to start before creating the user
sleep 10

curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
        "username": "adminUser",
        "email": "admin@example.com",
        "password": "password123",
        "phoneNumber": "1234567890"
    }'

kill $!

echo "Environment setup is complete."
