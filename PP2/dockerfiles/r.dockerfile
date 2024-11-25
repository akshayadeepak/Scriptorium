FROM r-base:latest

WORKDIR /app

CMD ["Rscript", "script.R"]