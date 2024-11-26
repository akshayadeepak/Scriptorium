FROM rust:latest

WORKDIR /app

CMD ["./target/release/my_app"]
