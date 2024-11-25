# Use the official R image
FROM r-base:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the R script into the container
COPY . .

# Command to run the R script
CMD ["Rscript", "script.R"]